# GearUp Auth API — Integration Spec (v1)

Authentication API reference for the GearUp backend, covering **email/password (credentials) login** and **Google OAuth 2.0 login**, written for a Next.js frontend integration.

- **Base path:** `/api/v1/auth`
- **Full base URL:** `<API_BASE_URL>/api/v1/auth` (e.g. `http://localhost:5000/api/v1/auth`)
- **Content type:** `application/json`
- **Auth scheme:** JWT — sent either as an `accessToken` cookie or an `Authorization: Bearer <token>` header

> A legacy credentials-only version of these endpoints still exists at `/api/auth` (no Google support). **Use `/api/v1/auth` for all new integration work.**

---

## Table of contents

1. [Response conventions](#1-response-conventions)
2. [Tokens & cookies](#2-tokens--cookies)
3. [Endpoint reference](#3-endpoint-reference)
   - [POST /register](#31-post-apiv1authregister)
   - [POST /login](#32-post-apiv1authlogin)
   - [GET /google](#33-get-apiv1authgoogle)
   - [GET /google/callback](#34-get-apiv1authgooglecallback)
   - [POST /refresh](#35-post-apiv1authrefresh)
   - [POST /logout](#36-post-apiv1authlogout)
4. [Google OAuth flow (end to end)](#4-google-oauth-flow-end-to-end)
5. [Data models](#5-data-models)
6. [Using the token on protected endpoints](#6-using-the-token-on-protected-endpoints)
7. [Next.js integration guide](#7-nextjs-integration-guide)
8. [CORS & allowed origins](#8-cors--allowed-origins)
9. [Known issues / questions for the backend team](#9-known-issues--questions-for-the-backend-team)

---

## 1. Response conventions

### Success envelope

Every successful response uses the same shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Human readable message",
  "data": { }
}
```

`meta` (`{ page, limit, total, totalPages }`) is only present on paginated list endpoints — never on auth endpoints.

### Error envelope

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid refresh token",
  "errorDetails": "Error: Invalid refresh token\n    at ...stack trace..."
}
```

- `message` is the only field safe to show to a user.
- `errorDetails` is a raw stack trace. **Do not render it in the UI.**
- Validation failures return one flattened string of all issues, e.g.
  `"email: Invalid email format, password: Password must be at least 6 characters"`.

### Detecting success on the client

Check the HTTP status code **and** the `success` flag. Do not rely on `statusCode` in the body alone.

---

## 2. Tokens & cookies

On successful credential login and Google login, the API sets two `Set-Cookie` headers:

| Cookie | Contains | Lifetime | Flags |
| --- | --- | --- | --- |
| `accessToken` | Short-lived JWT used to authorise API calls | 24 hours (`maxAge: 86400000`) | `HttpOnly`, `SameSite=None`, `Secure=false`, `Path=/` |
| `refreshToken` | Long-lived JWT used to mint a new access token | 7 days (`maxAge: 604800000`) | `HttpOnly`, `SameSite=None`, `Secure=false`, `Path=/` |

Both cookies are **HttpOnly** — browser JavaScript cannot read them. They are attached automatically by the browser only when the request is made with credentials enabled (`fetch(..., { credentials: 'include' })` or `axios` with `withCredentials: true`).

### JWT payload

Both tokens are signed with `HS256` and carry the same claims:

```json
{
  "userId": "0b0f2c2f-6f5b-4b0e-9c4f-1c9c1a2c3d4e",
  "email": "customer@example.com",
  "role": "CUSTOMER",
  "iat": 1760000000,
  "exp": 1760086400
}
```

Access and refresh tokens are signed with **different secrets**; expiry windows come from backend env vars (`JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`) and may differ from the cookie `maxAge` values above. Treat the JWT `exp` claim as the source of truth for token validity.

> ⚠️ **Cross-site cookie caveat.** The cookies are currently issued with `SameSite=None` **and** `Secure=false`. Chrome, Edge and Safari **reject** such cookies on cross-site requests. This works when frontend and API share an origin (or via a Next.js rewrite/proxy), but breaks when the Next.js app and the API are on different domains. See [§9](#9-known-issues--questions-for-the-backend-team) — for credential login you can work around this by using the tokens returned in the JSON body; the Google flow has no such fallback today.

---

## 3. Endpoint reference

### 3.1 `POST /api/v1/auth/register`

Creates a new credentials-based account. Does **not** log the user in — no cookies are set and no tokens are returned. Call `POST /login` afterwards.

**Auth:** none.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | yes | Valid email format. Must be unique. |
| `password` | string | yes | 6–20 characters. |
| `role` | `"CUSTOMER" \| "PROVIDER" \| "ADMIN"` | **yes in practice** | Marked optional by the request validator, but the database column has no default — omitting it fails with a 400. Always send it. |

```json
{
  "email": "customer@example.com",
  "password": "secret123",
  "role": "CUSTOMER"
}
```

**`201 Created`**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "0b0f2c2f-6f5b-4b0e-9c4f-1c9c1a2c3d4e",
      "name": null,
      "email": "customer@example.com",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "avatarUrl": null,
      "createdAt": "2026-08-12T10:15:00.000Z",
      "updatedAt": "2026-08-12T10:15:00.000Z"
    }
  }
}
```

The password hash is stripped from this response.

**Errors**

| Status | `message` | Cause |
| --- | --- | --- |
| `400` | `"email: Invalid email format"` (comma-joined list) | Zod validation failed |
| `400` | `"You have provided incorrect field type or missing fields"` | `role` was omitted |
| `409` | `"A user with this email already exists!"` | Email already registered (including via Google) |

> A user who first signed up with Google has an account row with `password: null`. Registering the same email again returns `409`, not an account merge. Direct such users to “Continue with Google”.

---

### 3.2 `POST /api/v1/auth/login`

Email + password login. Authenticated by a Passport **local** strategy.

**Auth:** none.

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `email` | string | yes | Valid email format |
| `password` | string | yes | Min length 1 |

```json
{
  "email": "customer@example.com",
  "password": "secret123"
}
```

**`200 OK`** — also sets the `accessToken` and `refreshToken` cookies.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "0b0f2c2f-6f5b-4b0e-9c4f-1c9c1a2c3d4e",
      "userId": "0b0f2c2f-6f5b-4b0e-9c4f-1c9c1a2c3d4e",
      "name": "Rezoan",
      "email": "customer@example.com",
      "password": "$2a$10$......",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "avatarUrl": null,
      "createdAt": "2026-08-12T10:15:00.000Z",
      "updatedAt": "2026-08-12T10:15:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

Notes on this payload:

- `id` and `userId` are the same value (`userId` is added by the Passport strategy). Prefer `id`.
- ⚠️ **`user.password` currently contains the bcrypt hash.** This is a backend bug (see [§9](#9-known-issues--questions-for-the-backend-team)). Never store it, log it, or put it in client-side state — strip it on receipt and expect it to disappear once fixed.
- `accessToken` / `refreshToken` are returned in the body **in addition to** the cookies, so a Bearer-token integration is possible without relying on cookies.

**Errors**

| Status | `message` | Cause |
| --- | --- | --- |
| `400` | `"email: Invalid email format"` etc. | Zod validation failed |
| `403` | `"Your account has been suspended. Please contact support."` | `status === SUSPENDED` |
| `500` | `"User not found with this email, Please register first!"` | Unknown email |
| `500` | `"Password does not matched"` | Wrong password |
| `500` | `"This account does not have password, Please login with google"` | Google-only account (`password: null`) |

> ⚠️ **Authentication failures currently return HTTP `500`, not `401`.** Passport failures are forwarded as plain `Error` objects, which the global error handler cannot classify. **Do not branch on the status code for login failures** — read `message` instead, or treat any non-2xx from this endpoint as “login failed”. This is expected to change to `401` once fixed; write your handler so it tolerates both.

---

### 3.3 `GET /api/v1/auth/google`

Starts the Google OAuth 2.0 flow. Responds with a `302` redirect to Google's consent screen (`scope: profile email`).

**Auth:** none. **Request body:** none. **Query params:** none supported.

This is a **browser navigation endpoint, not an AJAX endpoint.** It must be reached by a full page navigation:

```tsx
<a href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`}>
  Continue with Google
</a>
```

Calling it with `fetch`/`axios` will fail (CORS blocks the cross-origin redirect to Google).

> New accounts created through Google are always assigned `role: "CUSTOMER"`. There is currently no way to sign up as a `PROVIDER` through Google — providers must use `POST /register`.

---

### 3.4 `GET /api/v1/auth/google/callback`

The redirect URI that Google calls back with `?code=...`. **The frontend never calls this directly.** It must exactly match the `GOOGLE_REDIRECT_URI` configured in both the backend `.env` and the Google Cloud Console OAuth client.

On success the endpoint:

1. Finds the user by the Google-provided email, or creates one (`name` = Google display name, `role` = `CUSTOMER`).
2. If the user already exists as a credentials account, links a `GOOGLE` auth record to it — same account, same `id`. Email/password login keeps working.
3. Sets the `accessToken` and `refreshToken` cookies (same flags as §2).
4. Issues `302 Found` → **`<APP_URL>/customer`**.

> The redirect target is hardcoded to `/customer` regardless of the user's role, and no tokens are placed in the redirect URL — the session lives purely in the cookies. `APP_URL` is a backend env var; the client team must confirm it points at the correct Next.js origin per environment.

**On failure** the callback does not redirect. It falls through to the global error handler and returns a JSON error page in the browser:

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Google authentication Failed",
  "errorDetails": "..."
}
```

Other failure messages: `"No email found from google!"`, or `"Your account has been suspended. Please contact support."` (403) for suspended accounts.

---

### 3.5 `POST /api/v1/auth/refresh`

Exchanges the refresh-token cookie for a fresh access token.

**Auth:** requires the `refreshToken` **cookie**. The token is read from cookies only — a request body or `Authorization` header is ignored. Send with credentials enabled.

**Request body:** none.

**`200 OK`** — also sets a new `accessToken` cookie.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Token Refreshed Successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors**

| Status | `message` | Cause |
| --- | --- | --- |
| `400` | `"refreshToken: Refresh token is required"` | Cookie missing / not forwarded |
| `401` | `"jwt expired"` / `"invalid signature"` / `"Invalid refresh token"` | Refresh token expired or invalid — force a re-login |

> The refresh token is **not rotated** — the same refresh cookie stays valid for its full 7 days. There is no server-side revocation, so `POST /logout` only clears the browser's cookies; a copied token remains valid until it expires.

---

### 3.6 `POST /api/v1/auth/logout`

Clears the `accessToken` and `refreshToken` cookies.

**Auth:** none required (always succeeds). **Request body:** none.

**`200 OK`**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged out successfully",
  "data": null
}
```

Must be called with credentials enabled for the cookie clearing to reach the browser. If you also keep tokens in client state, clear them yourself.

---

## 4. Google OAuth flow (end to end)

```
Browser (Next.js)                 GearUp API                     Google
      |                                |                             |
      |  user clicks "Continue with Google"                          |
      |  full-page nav                 |                             |
      | -----------------------------> |                             |
      |  GET /api/v1/auth/google       |                             |
      |                                |  302 -> accounts.google.com |
      | <------------------------------|---------------------------> |
      |                                |                             |
      |          user consents on Google's screen                    |
      |                                |                             |
      |                                |  302 back with ?code=...    |
      | <----------------------------------------------------------- |
      | -----------------------------> |                             |
      |  GET /api/v1/auth/google/callback?code=...                   |
      |                                |  exchange code, upsert user |
      |                                |  Set-Cookie: accessToken    |
      |                                |  Set-Cookie: refreshToken   |
      | <----------------------------- |                             |
      |  302 -> <APP_URL>/customer     |                             |
      |                                |                             |
      |  GET /api/user/me (credentials: include) to hydrate session  |
      | -----------------------------> |                             |
```

**Frontend responsibilities**

1. Render a plain link/anchor (or `window.location.href = ...`) to `GET /api/v1/auth/google`. Never `fetch` it.
2. Build a page at `/customer` that runs on load: call `GET /api/user/me` with credentials to fetch the signed-in user, then route by `role` (a `PROVIDER` or `ADMIN` who signs in with Google also lands on `/customer` — redirect them from there).
3. Handle the "already there" case — if `/api/user/me` returns `401`, the cookie did not survive the redirect (see the cross-site cookie caveat in §2) and the user should be shown the login page again.

---

## 5. Data models

### User

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string (uuid) | Primary key |
| `name` | string \| null | `null` for credentials sign-ups; Google display name for Google sign-ups |
| `email` | string | Unique |
| `password` | string \| null | bcrypt hash; `null` for Google-only accounts. Should never reach the client (see §9) |
| `role` | `CUSTOMER` \| `PROVIDER` \| `ADMIN` | |
| `status` | `ACTIVE` \| `SUSPENDED` | `SUSPENDED` blocks login and every authenticated request |
| `avatarUrl` | string \| null | Not populated from the Google profile today |
| `createdAt` | ISO 8601 string | |
| `updatedAt` | ISO 8601 string | |

### Auth (linked identities — not exposed by any auth endpoint)

One row per sign-in method attached to a user: `provider` is `CREDENTIALS` or `GOOGLE`. A single user can hold both, which is how account linking works when a credentials user later signs in with Google.

### Suggested TypeScript types

```ts
export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSuccess<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errorDetails?: string;
}

export type LoginData = {
  user: User & { userId: string };
  accessToken: string;
  refreshToken: string;
};
```

---

## 6. Using the token on protected endpoints

Protected routes accept the access token in **either** form; the cookie is checked first:

```http
Cookie: accessToken=<jwt>
```

```http
Authorization: Bearer <jwt>
```

On every protected request the API re-reads the user from the database and rejects suspended accounts, so a valid token alone is not enough.

**Common auth errors on protected endpoints**

| Status | `message` |
| --- | --- |
| `401` | `"You are not logged in. Please log in to access this resource."` |
| `401` | `"jwt expired"` — call `POST /refresh`, then retry once |
| `403` | `"Forbidden. You don't have permission to access this resource."` (role mismatch) |
| `403` | `"Your account has been blocked. Please contact support."` |
| `404` | `"User not found. Please log in again."` |

Useful endpoint for session hydration: **`GET /api/user/me`** (any authenticated role).

---

## 7. Next.js integration guide

### 7.1 Environment

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

The backend must have `APP_URL` set to your Next.js origin (it drives both CORS and the post-Google redirect) and `GOOGLE_REDIRECT_URI` set to `<API_URL>/api/v1/auth/google/callback`.

### 7.2 Recommended setup: same-origin proxy

Because of the `SameSite=None; Secure=false` cookie issue, the most reliable setup is to proxy the API through your Next.js origin so the cookies become same-site:

```js
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};
```

Then call `/api/backend/v1/auth/login` etc. from the browser. If you use the proxy, point the Google link at `/api/backend/v1/auth/google` as well, and make sure the backend's `GOOGLE_REDIRECT_URI` still points at the real API host.

Without the proxy, use the Bearer-token path described in §7.5.

### 7.3 Client-side fetch helper

```ts
const API = process.env.NEXT_PUBLIC_API_URL!;

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include', // required — cookies are HttpOnly
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    throw new Error(body?.message ?? 'Request failed');
  }
  return body.data as T;
}
```

### 7.4 Credential login

```ts
export async function login(email: string, password: string) {
  const data = await apiFetch<LoginData>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Strip the hash the API currently leaks before touching app state.
  const { password: _drop, userId: _dup, ...user } = data.user as any;
  return { user: user as User, accessToken: data.accessToken };
}
```

Remember: any non-2xx here means "login failed" — including the current `500`s. Surface `error.message` directly; the backend messages are already user-readable.

### 7.5 Alternative: Bearer tokens (no cookies)

If cross-site cookies are blocked in your deployment, credential login still works — take `accessToken` from the JSON body, keep it in memory (plus `refreshToken` in storage if you must), and send it as `Authorization: Bearer <token>`.

**This does not cover Google login**, which delivers its session only via cookies. Google sign-in therefore requires either the same-origin proxy from §7.2 or the backend fix in §9.

### 7.6 Server Components / Route Handlers

Forward the incoming cookies when calling the API from the server:

```ts
import { cookies } from 'next/headers';

export async function getMe() {
  const cookieStore = await cookies();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/me`, {
    headers: { Cookie: cookieStore.toString() },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()).data;
}
```

Note that `Set-Cookie` headers returned by the API in a Server Component are **not** forwarded to the browser automatically — perform login and refresh from the browser, or from a Route Handler that re-emits the cookies.

### 7.7 Refresh-on-401 pattern

```ts
async function withRefresh<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (err) {
    await fetch(`${API}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }); // throws/fails -> redirect to /login
    return await call(); // retry once, never loop
  }
}
```

Refresh once per failed request at most. A failed refresh means the 7-day refresh token is gone — clear local state and send the user to the login page.

### 7.8 Middleware / route protection

`middleware.ts` can check for the presence of the `accessToken` cookie to gate routes, but it **cannot verify** it (the signing secret lives on the backend). Use it for coarse redirects only, and let the API be the real authority:

```ts
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('accessToken');
  if (!hasSession && req.nextUrl.pathname.startsWith('/customer')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}
```

---

## 8. CORS & allowed origins

The API runs with `credentials: true` and an origin allowlist:

- the backend's `APP_URL` env value
- `http://localhost:3000`
- `https://gearup-rent.netlify.app`
- `https://gear-up-self.vercel.app`

Requests from any other origin are rejected by CORS. **If you deploy the Next.js app to a new domain, the backend allowlist must be updated first** — this is a code change in `src/app.ts`, not just an env var (unless the new domain is set as `APP_URL`).

---

## 9. Known issues / questions for the backend team

These are behaviours observed in the current implementation that affect integration. They are listed here so the client can code defensively and so the backend team can prioritise fixes.

| # | Issue | Impact on the frontend | Suggested fix |
| --- | --- | --- | --- |
| 1 | **Login failures return `500`** instead of `401`/`404`. Passport failures are wrapped in a plain `Error`. | Cannot branch on status code; must read `message`. | Throw `UnauthorizedError`/`NotFoundError` from the login controller. |
| 2 | **The bcrypt password hash is returned** in `POST /login` → `data.user.password`. | Security risk; must be stripped client-side. | Strip `password` (and the duplicate `userId`) before `sendResponse`. |
| 3 | **Cookies use `SameSite=None` with `Secure=false`.** Browsers reject this combination cross-site. | Google login silently produces no session when frontend and API are on different domains. | Set `secure: true` in production and drive both flags from `NODE_ENV`. |
| 4 | **`errorDetails` returns a full stack trace** on every error, in every environment. | Must never be rendered. | Omit in production. |
| 5 | **Google callback always redirects to `<APP_URL>/customer`**, regardless of role. | Providers/admins land on the customer route and must be re-routed client-side. | Redirect by role, or to a neutral `/auth/callback` page. |
| 6 | **No role selection on Google sign-up** — new Google users are always `CUSTOMER`. `OAUTH_STATE_SECRET` exists in config but the `state` param is not wired up. | Providers cannot onboard via Google. | Pass a signed `state` carrying the intended role through `/google`. |
| 7 | **Google callback errors return raw JSON in the browser**, not a redirect. | User sees a JSON blob instead of an error page. | Redirect to `<APP_URL>/login?error=...`. |
| 8 | **Refresh tokens are not rotated or revocable**; `POST /logout` only clears cookies. | A stolen refresh token stays valid for 7 days after logout. | Persist and invalidate refresh tokens server-side. |
| 9 | **`role` is optional in the register validator** but required by the database. | Omitting it yields a confusing generic `400`. | Make `role` required in the Zod schema, or default it to `CUSTOMER`. |

---

*Generated against the `authV1` module (`src/modules/authV1/`), `src/config/passport.ts`, and `src/app.ts` as of 2026-08-12.*
