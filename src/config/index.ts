import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

/**
 * Env values arrive hand-pasted (dashboard UIs, .env files) and a single stray
 * character breaks things silently: CORS compares origins by exact string, so
 * `https://app.example.com/` never matches the browser's `https://app.example.com`.
 */
const normalizeUrl = (value?: string) => {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed ? trimmed : undefined;
};

const splitUrlList = (value?: string) =>
  (value ?? '')
    .split(',')
    .map(normalizeUrl)
    .filter((entry): entry is string => Boolean(entry));

const app_url = normalizeUrl(process.env.APP_URL) ?? 'http://localhost:3000';
const api_url = normalizeUrl(process.env.API_URL);

/**
 * Known frontends stay in the code rather than living only in `APP_URL`: env
 * vars drift (a stale `APP_URL` silently blocks the current frontend and sends
 * post-OAuth redirects to a dead domain), and a deploy of this file is enough
 * to recover. `CORS_ORIGINS` (comma-separated) covers anything not listed here.
 */
const wellKnownOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://gear-up-frontend-green.vercel.app',
  'https://gearup-rent.netlify.app',
];

export default {
  port: process.env.PORT,
  node_env: process.env.NODE_ENV,
  database_url: process.env.DATABASE_URL,
  /** Frontend origin: drives CORS and the post-OAuth redirect target. */
  app_url,
  /** Public origin of this API — must match the host Google calls back on. */
  api_url,
  prod_url: process.env.PROD_URL,
  cors_origins: Array.from(
    new Set([
      app_url,
      ...(api_url ? [api_url] : []),
      ...splitUrlList(process.env.CORS_ORIGINS),
      ...wellKnownOrigins,
    ]),
  ),
  /** Vercel gives every preview build its own hostname; allow this app's. */
  cors_origin_patterns: [
    /^https:\/\/gear-up-frontend[a-z0-9-]*\.vercel\.app$/,
    /^https:\/\/gear-up[a-z0-9-]*\.vercel\.app$/,
  ],
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET!,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET!,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN!,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN!,
  ssl_commerz_store_id: process.env.SSL_COMMERZ_STORE_ID,
  ssl_commerz_store_passwd: process.env.SSL_COMMERZ_STORE_PASSWORD,
  google_client_id: process.env.GOOGLE_CLIENT_ID!,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  google_redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
  oauth_state_secret: (process.env.OAUTH_STATE_SECRET ||
    process.env.JWT_ACCESS_SECRET)!,
};
