import { and, eq } from 'drizzle-orm';
import { RedirectType, redirect } from 'next/navigation';
import { z } from 'zod';
import { integrations } from '~/integrations/list';
import { getIntegrationId } from '~/integrations/utils';
import { accessTokenHandler, getAccessToken } from '~/integrations/utils/defaultHandlers';
import { db } from '~/server/db';
import { Integration } from '~/server/schema';
import { scrapeIntegration } from '~/server/tasks/scrape/scrapeIntegration';
import { getUser } from '~/utils/server-auth';
import { connectIntegration } from '~/utils/backend';
import { parseJSONObject } from '~/utils/validators';
import he from 'he';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateCSRFTokenCookie } from '~/utils/csrf';
import { BASE_URL } from '~/utils/constants';

const stateSchema = z.object({
  c: z.string(),
});

type Props = {
  params: { provider: string };
};

export const GET = async (req: NextRequest, { params: { provider } }: Props) => {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const installed = req.nextUrl.searchParams.get('installed');
  const error_description = req.nextUrl.searchParams.get('error_description');

  const user = await getUser();
  if (!user) {
    return new NextResponse('Login required.', { status: 403 });
  }

  const integration = integrations.find((i) => {
    return getIntegrationId(i) === provider;
  });
  if (!integration?.tokenUrl || !integration.clientId) {
    return new NextResponse('Integration not found.', { status: 404 });
  }

  const id = getIntegrationId(integration);
  const secret = process.env[`INTEGRATION_${id.toUpperCase()}_SECRET`];
  if (!secret) {
    return new NextResponse('Integration missing app secret.', { status: 404 });
  }

  if (!code) {
    if (installed) {
      const existingConnection = await db.query.Integration.findFirst({
        where: and(eq(Integration.provider, provider), eq(Integration.userId, user.id)),
      });
      if (!existingConnection) {
        return new NextResponse('Missing integration.', { status: 404 });
      }
      await scrapeIntegration.enqueue(existingConnection.id);
      return NextResponse.rewrite(new URL(`/onboard/callback/${provider}/success`, BASE_URL));
    }
    const error = error_description ?? 'Missing code.';
    return new NextResponse(he.decode(error), { status: 404 });
  }

  const s = stateSchema.safeParse(parseJSONObject(state));

  if (!s.success) {
    console.error(s.error.message);
    console.error(s.error.message);
    return new NextResponse('Invalid OAuth state.', { status: 403 });
  }

  if (!validateCSRFTokenCookie(req, s.data.c)) {
    return new NextResponse('Invalid CSRF token.', { status: 403 });
  }

  // overwrite integration configs in DEV using .env file
  const client_id = process.env[`INTEGRATION_${id.toUpperCase()}_CLIENT_ID`] ?? integration.clientId;

  const resp = await accessTokenHandler(integration, req, secret, code, client_id);

  const token = await getAccessToken(integration, resp, true);
  if (!token) {
    return new NextResponse('Invalid OAuth code.', { status: 403 });
  }

  const userInfo = await integration.userInfoHandler(integration, token.access_token);
  const { error } = userInfo;
  if (error ?? !userInfo.info) {
    return new NextResponse('Unable to get user info.', { status: 404 });
  }

  const created = await connectIntegration(req, integration, user, userInfo, token);
  if (!created) {
    return new NextResponse(
      `You’ve already connected ${integration.name} account ${userInfo.username}. Log into ${integration.name} with a different account.`,
      { status: 403 },
    );
  }

  if (integration.postInstallUrl) {
    redirect(integration.postInstallUrl, RedirectType.replace);
  }

  return NextResponse.rewrite(new URL(`/onboard/callback/${provider}/success`, BASE_URL));
};
