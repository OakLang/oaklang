import type { AuthorizeUrlBuilder } from '~/utils/types';

import { getCSRFTokenCookie } from '~/utils/csrf';
import { getRedirectUri } from 'src/integrations/utils';

export const TwitterAuthorizeUrlBuilder: AuthorizeUrlBuilder = (integration, req, scope, authorize_url, client_id, state): string => {
  const challenge = getCSRFTokenCookie(req);

  let url = `${authorize_url}?response_type=code&client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(
    getRedirectUri(integration),
  )}&code_challenge=${challenge}&code_challenge_method=plain&state=${state}`;
  if (scope) {
    url = `${url}&scope=${encodeURIComponent(scope)}`;
  }
  return url;
};

export const TikTokAuthorizeUrlBuilder: AuthorizeUrlBuilder = (integration, req, scope, authorize_url, client_id, state): string => {
  let url = `${authorize_url}?response_type=code&client_key=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(
    getRedirectUri(integration),
  )}&state=${state}`;
  if (scope) {
    url = `${url}&scope=${encodeURIComponent(scope)}`;
  }
  return url;
};
