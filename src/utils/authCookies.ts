import { CookieOptions, Response } from 'express';
import config from '../config';

/**
 * The frontend and this API are deployed on different hostnames
 * (`*-frontend-*.vercel.app` vs `gear-up-*.vercel.app`), which browsers treat
 * as *cross-site* — `vercel.app` is on the Public Suffix List, so the two
 * subdomains are separate sites and no shared cookie `Domain` is possible.
 * Cross-site cookies are only stored/sent with `SameSite=None`, and browsers
 * reject `SameSite=None` unless `Secure` is also set.
 *
 * When both URLs share a hostname (localhost in dev, or the API proxied through
 * the Next.js app in production) the cookies are first-party, so `Lax` is used:
 * it survives without HTTPS in dev and is not subject to third-party-cookie
 * blocking.
 */
const hostnameOf = (url?: string) => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
};

const appHostname = hostnameOf(config.app_url);
const apiHostname = hostnameOf(config.api_url);

/** Unknown API host ⇒ assume split domains, the setup that needs `None`. */
export const isCrossSiteFrontend =
  !appHostname || !apiHostname || appHostname !== apiHostname;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  path: '/',
  secure: isCrossSiteFrontend || config.node_env === 'production',
  sameSite: isCrossSiteFrontend ? 'none' : 'lax',
};

export const accessTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 1000 * 60 * 60 * 24, // 1 day
};

export const refreshTokenCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) => {
  // Keep tokens out of any shared cache (Vercel's CDN sits in front of this).
  res.setHeader('Cache-Control', 'no-store');
  res.cookie('accessToken', tokens.accessToken, accessTokenCookieOptions);
  res.cookie('refreshToken', tokens.refreshToken, refreshTokenCookieOptions);
};

export const clearAuthCookies = (res: Response) => {
  res.setHeader('Cache-Control', 'no-store');
  // Attributes must match the ones the cookies were set with, or the browser
  // keeps the originals alongside the empty ones.
  res.clearCookie('accessToken', baseCookieOptions);
  res.clearCookie('refreshToken', baseCookieOptions);
};
