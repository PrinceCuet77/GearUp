import crypto from 'crypto';
import config from '../config';
import { isAllowedOrigin } from '../config/cors';
import { UserRole } from '../../generated/prisma/enums';

/**
 * Google's OAuth redirect can't carry a request body, so everything the
 * callback needs is round-tripped through the OAuth `state` query param: the
 * role the user picked on the registration screen, where to hand control back
 * to, and which frontend origin the flow started on.
 *
 * State travels through the user's browser, so it is HMAC-signed: without a
 * signature anyone could hit /api/v1/auth/google?role=ADMIN and mint themselves
 * an admin account, or point `origin` at a site of their choosing and turn the
 * callback into a token-leaking open redirect.
 */

/** The only roles that may ever be self-selected during signup. */
export type SelectableRole = Extract<UserRole, 'CUSTOMER' | 'PROVIDER'>;

export type OAuthStatePayload = {
  role?: SelectableRole;
  redirect?: string;
  /** Frontend origin captured (and allowlisted) when the flow started. */
  origin?: string;
  nonce: string;
};

/** A consent screen left open longer than this is treated as abandoned. */
const STATE_MAX_AGE_MS = 10 * 60 * 1000;

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
  origin?: string;
}) => {
  const nonce = crypto.randomBytes(16).toString('hex');
  const body = Buffer.from(
    JSON.stringify({ ...payload, nonce, iat: Date.now() }),
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

    const issuedAt = Number(parsed.iat);
    if (!Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > STATE_MAX_AGE_MS) return null;

    return {
      // Anything other than CUSTOMER/PROVIDER is dropped, signed or not.
      role: isSelectableRole(parsed.role) ? parsed.role : undefined,
      redirect: isSafeRedirectPath(parsed.redirect) ? parsed.redirect : undefined,
      // Re-checked on the way out: the allowlist may have shrunk since signing.
      origin: isAllowedOrigin(
        typeof parsed.origin === 'string' ? parsed.origin : undefined,
      )
        ? (parsed.origin as string)
        : undefined,
      nonce: String(parsed.nonce ?? ''),
    };
  } catch {
    return null;
  }
};

/**
 * Only same-app relative paths are honoured, so `?redirect=https://evil.com`
 * (or the protocol-relative `//evil.com`) can't turn the callback into an open
 * redirect that leaks the freshly minted session.
 */
export const isSafeRedirectPath = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/\\');

/** Where a user lands after signing in, when no `redirect` was requested. */
export const defaultLandingPath = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin';
    case UserRole.PROVIDER:
      return '/provider';
    default:
      return '/customer';
  }
};

/**
 * Builds the frontend URL to hand control back to. The base origin comes from
 * the signed state first (the origin the user actually started on) and falls
 * back to `APP_URL` — so a stale `APP_URL` in the deployment environment can no
 * longer bounce users to a dead frontend.
 */
export const resolveFrontendRedirect = ({
  origin,
  redirect,
  fallbackPath = '/customer',
  query = {},
  fragment = {},
}: {
  origin?: string;
  redirect?: string;
  fallbackPath?: string;
  query?: Record<string, string | undefined>;
  /**
   * Goes after the `#`, which browsers never send to a server — so tokens
   * handed to the frontend this way stay out of access logs and `Referer`
   * headers, unlike query params.
   */
  fragment?: Record<string, string | undefined>;
}) => {
  const base = (isAllowedOrigin(origin) ? origin : config.app_url).replace(
    /\/$/,
    '',
  );

  const path = isSafeRedirectPath(redirect) ? redirect : fallbackPath;

  const url = new URL(`${base}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }

  const hash = new URLSearchParams();
  for (const [key, value] of Object.entries(fragment)) {
    if (value !== undefined) hash.set(key, value);
  }
  if (Array.from(hash.keys()).length) url.hash = hash.toString();

  return url.toString();
};
