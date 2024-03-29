import { BASE_URL, NODE_ENV } from '~/utils/constants';
import type { InternalIntegration, OAuthResponse } from '~/utils/types';
import type { Integration } from '~/server/schema';
import { encodeRS256JWT } from '~/utils/jwt';
import { getCSRFTokenCookie } from '~/utils/csrf';
import { integrations } from '~/integrations/list';
import type { NextRequest } from 'next/server';

export const getIntegrationIdFromName = (integrationName: string): string => {
  if (integrationName.toLocaleLowerCase() === 'hacker news') {
    return 'y_combinator';
  }
  return integrationName.replaceAll(' ', '_').replaceAll(/[^\w]/g, '').toLowerCase();
};

export const getIntegrationId = (integration: InternalIntegration): string => {
  return getIntegrationIdFromName(integration.name);
};

export const getRedirectUri = (integration: InternalIntegration): string => {
  const id = getIntegrationId(integration);
  if (NODE_ENV === 'development' && (id == 'product_hunt' || id == 'instagram' || id == 'tiktok' || id == 'wikipedia')) {
    return `https://wonderful.dev/onboard/callback/${id}`;
  }
  return `${BASE_URL}/onboard/callback/${id}`;
};

export const getOAuthUrl = (integration: InternalIntegration, req: NextRequest): string => {
  if (!integration.authorizeUrl || !integration.clientId) {
    return '';
  }
  const scope = integration.scopes?.default;

  // overwrite integration configs in DEV using .env file
  const authorize_url = process.env[`INTEGRATION_${getIntegrationId(integration).toUpperCase()}_AUTHORIZE_URL`] ?? integration.authorizeUrl;
  const client_id = process.env[`INTEGRATION_${getIntegrationId(integration).toUpperCase()}_CLIENT_ID`] ?? integration.clientId;
  const token = getCSRFTokenCookie(req);
  const state = encodeURIComponent(btoa(JSON.stringify({ c: token })));

  if (integration.authorizeUrlBuilder) {
    return integration.authorizeUrlBuilder(integration, req, scope, authorize_url, client_id, state);
  }

  let url = `${authorize_url}?response_type=code&client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(
    getRedirectUri(integration),
  )}&state=${state}`;
  if (scope) {
    url = `${url}&scope=${encodeURIComponent(scope)}`;
  }
  return url;
};

export interface FetchOptions extends RequestInit {
  /** Sets Accept and Content-Type headers. */
  isJson?: boolean;
  /** Number of seconds to wait for response before aborting the request. */
  timeout?: number;
}

/* wonderfulFetch is a wrapper around node fetch that:
   - Sets a default User-Agent
   - Sets a default Request Timeout
   - Sets Accept and Content-Type headers if isJson is true.
 */
export const wonderfulFetch = async (url: string, init?: FetchOptions): Promise<Response> => {
  const timeout = init?.timeout ?? 10;
  const isJson = init?.isJson ?? true;

  const options: RequestInit = init ?? {};

  options.headers = new Headers(options.headers ?? {});
  if (!options.headers.has('User-Agent')) {
    options.headers.set('User-Agent', 'wonderful.dev');
  }
  if (isJson && !options.headers.has('Accept')) {
    options.headers.set('Accept', 'application/json');
  }

  if (!options.method) {
    options.method = 'GET';
  }

  if (isJson && options.method !== 'GET' && !options.headers.has('Content-Type')) {
    options.headers.set('Content-Type', 'application/json');
  }

  if (!options.signal) {
    options.signal = AbortSignal.timeout(timeout * 1000);
  }

  return fetch(url, options);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rJT = async (r: Response): Promise<any> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const j = await r.json();
    if (j) {
      return j as unknown;
    }
  } catch (e) {
    /* empty */
  }

  return await r.text();
};

export const gitHubAppRequest = async (connection: typeof Integration.$inferSelect, method: string, url: string, body?: string) => {
  const integrationConfig = integrations.find((i) => {
    return getIntegrationId(i) === connection.provider;
  });
  if (!integrationConfig) {
    return undefined;
  }

  const appId =
    process.env[`INTEGRATION_${connection.provider.toUpperCase()}_APP_ID`] ??
    (integrationConfig.extraAppInfo as { appId: string } | null)?.appId;
  if (!appId) {
    return undefined;
  }
  const secretKey = process.env.INTEGRATION_GITHUB_SECRET_KEY!;
  if (!secretKey) {
    return;
  }
  const jwt = await encodeRS256JWT(appId, secretKey);
  const payload: FetchOptions = {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${jwt}`,
    },
    method: method,
  };
  if (body) {
    payload.body = body;
  }
  return await wonderfulFetch(url, payload);
};

export const getExpiresAt = (data: OAuthResponse): Date | undefined => {
  if (data.expires_at) {
    return new Date(data.expires_at);
  }
  if (data.expires_in) {
    if (typeof data.expires_in === 'string') {
      data.expires_in = parseInt(data.expires_in);
    }
    return new Date(Date.now() + data.expires_in);
  }
  return undefined;
};
