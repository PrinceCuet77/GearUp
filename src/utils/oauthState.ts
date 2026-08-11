import crypto from 'crypto';
import config from '../config';
import { UserRole } from '../../generated/prisma/enums';

/**
 * Google's OAuth redirect can't carry a request body, so the role the user
 * picked on the registration screen is round-tripped through the OAuth `state`
 * query param. State travels through the user's browser, so it is HMAC-signed:
 * without a signature anyone could hit /api/auth/google?role=ADMIN and mint
 * themselves an admin account.
 */

/** The only roles that may ever be self-selected during signup. */
export type SelectableRole = Extract<UserRole, 'CUSTOMER' | 'PROVIDER'>;

export type OAuthStatePayload = {
  role?: SelectableRole;
  redirect?: string;
  nonce: string;
};

const isSelectableRole = (value: unknown): value is SelectableRole =>
  value === UserRole.CUSTOMER || value === UserRole.PROVIDER;

const sign = (data: string) =>
  crypto
    .createHmac('sha256', config.oauth_state_secret)
    .update(data)
    .digest('base64url');

export const createOAuthState = (payload: {
  role?: SelectableRole;
  redirect?: string;
}) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  const body = Buffer.from(
    JSON.stringify({ ...payload, nonce }),
    'utf8',
  ).toString('base64url');

  return { state: `${body}.${sign(body)}`, nonce };
};

export const parseOAuthState = (
  state?: string | null,
): OAuthStatePayload | null => {
  if (!state) return null;

  const [body, signature] = state.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as Record<string, unknown>;

    return {
      // Anything other than CUSTOMER/PROVIDER is dropped, signed or not.
      role: isSelectableRole(parsed.role) ? parsed.role : undefined,
      redirect:
        typeof parsed.redirect === 'string' ? parsed.redirect : undefined,
      nonce: String(parsed.nonce ?? ''),
    };
  } catch {
    return null;
  }
};

/**
 * Builds the frontend URL to hand control back to. Only same-app relative
 * paths are honoured, so `?redirect=https://evil.com` can't turn this
 * endpoint into an open redirect.
 */
export const resolveFrontendRedirect = (
  redirect: string | undefined,
  query: Record<string, string | undefined> = {},
) => {
  const base = (config.app_url ?? 'http://localhost:3000').replace(/\/$/, '');

  const path =
    redirect && redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : '/oauth/callback';

  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  return url.toString();
};
