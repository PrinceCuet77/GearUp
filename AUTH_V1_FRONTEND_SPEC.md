# GearUp Auth V1 — Frontend Implementation Spec

Instructions for implementing credentials login/registration **and** Google OAuth 2.0
against the new `/api/v1/auth` module.

Backend is already built, deployed-ready and verified. **Do not change any backend
code** — implement the frontend to match this contract exactly.

---

## 0. Summary of what changes

1. **All auth calls move from `/api/auth/*` to `/api/v1/auth/*`.** The old `/api/auth`
   still exists but has no Google support and is frozen. Migrate every auth call.
2. **A new page/route `/oauth/callback` must be created.** Google returns the user there.
3. The existing **Customer / Provider** role tiles now also drive Google signup, via
   **two dedicated endpoints** — `/google/customer` and `/google/provider` — instead of
   a shared endpoint with a `role` query param. The role is baked into which URL you
   navigate to, not a parameter on it.
4. Auth is **cookie-based** (httpOnly). Every request needs credentials included.

---

## 1. Environment

```
VITE_API_URL=http://localhost:5000          # Vite
# or NEXT_PUBLIC_API_URL=http://localhost:5000   # Next.js
```

Auth base path: `${API_URL}/api/v1/auth`

Production API URL: use whatever the deployed backend URL is (the same one already
configured for gear/rental calls).

---

## 2. Response envelope

Every endpoint (success and error) returns JSON in one of these two shapes.

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": { },
  "meta": null
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid password",
  "errorDetails": "Error: Invalid password\n    at ..."
}
```

**Rules:**
- Display `body.message` to the user. It is a human-readable sentence, safe to show.
- **Never display `errorDetails`** — it is a raw stack trace. Log it in dev only.
- Payload always lives under `body.data`. Read `data`, not the root.

---

## 3. Endpoints

### 3.1 `POST /api/v1/auth/register`

```ts
// Request body
{
  email: string;      // valid email
  password: string;   // 6–20 characters (max 20 is enforced — validate client-side too)
  role: "CUSTOMER" | "PROVIDER";   // ⚠️ REQUIRED in practice — see note
}
```

> ⚠️ **`role` must always be sent.** The Zod schema marks it optional, but the database
> column has no default, so omitting it produces a confusing
> `400 "You have provided incorrect field type or missing fields"`. Always send the role
> from the selected tile. Never send `"ADMIN"` — admins are created server-side only.

**`201` response:**
```json
{ "success": true, "statusCode": 201, "message": "User registered successfully",
  "data": { "user": { "id": "uuid", "name": null, "email": "a@b.com",
                      "role": "CUSTOMER", "status": "ACTIVE", "avatarUrl": null,
                      "createdAt": "...", "updatedAt": "..." } } }
```

> ⚠️ **Register does NOT log the user in.** No cookies are set and no tokens are
> returned. After a successful register you must either (a) immediately call
> `POST /api/v1/auth/login` with the same credentials, or (b) redirect to the login
> page with a success toast. Pick (a) for a smoother flow.

**Errors:** `409` `"A user with this email already exists!"` · `400` validation message
listing the bad fields (e.g. `"password: Password must be at least 6 characters"`).

---

### 3.2 `POST /api/v1/auth/login`

```ts
// Request body
{ email: string; password: string }
```

**`200` response** — and sets two httpOnly cookies (`accessToken` 1 day,
`refreshToken` 7 days):
```json
{ "success": true, "statusCode": 200, "message": "User logged in successfully",
  "data": {
    "user": { "id": "uuid", "name": null, "email": "a@b.com", "role": "PROVIDER",
              "status": "ACTIVE", "avatarUrl": null, "createdAt": "...", "updatedAt": "..." },
    "accessToken": "jwt...",
    "refreshToken": "jwt..."
  } }
```

`data.user` never contains a password field. Store `data.user` in your auth store.

> **Ignore `accessToken` / `refreshToken` in the browser.** They exist for Postman and
> future mobile clients. The browser is authenticated by the httpOnly cookies, which JS
> cannot read. **Do not put them in `localStorage`/`sessionStorage`** — that's an XSS
> exfiltration risk and it's redundant.

**Errors:**

| Status | `message` | What the UI should do |
|---|---|---|
| `404` | `User not found` | Inline error on the email field |
| `401` | `Invalid password` | Inline error on the password field |
| `401` | `This account was created with Google. Please continue with Google.` | **Show a "Continue with Google" button instead** — see §6.3 |
| `403` | `Your account has been suspended. Please contact support.` | Full-form error, no retry |
| `400` | validation message | Inline field errors |

---

### 3.3 `POST /api/v1/auth/refresh`

No body. Reads the `refreshToken` cookie automatically — you must send credentials.

**`200`:** `{ "data": { "accessToken": "jwt..." } }` and sets a fresh `accessToken` cookie.

**Errors:** `400` `"refreshToken: Refresh token is required"` (no cookie present) ·
`401` `"Invalid refresh token"` (expired/invalid → force logout).

---

### 3.4 `POST /api/v1/auth/logout`

No body. Clears both cookies. Always `200` with `data: null`.
Clear your client auth store regardless of the outcome.

---

### 3.5 `GET /api/v1/auth/google/customer` and `GET /api/v1/auth/google/provider` — start Google sign-in

Two role-dedicated endpoints — no `role` query param. Which URL you navigate to fixes
the role; there's no way to pass the wrong role by mistake.

```
GET ${API_URL}/api/v1/auth/google/customer?redirect=/oauth/callback
GET ${API_URL}/api/v1/auth/google/provider?redirect=/oauth/callback
```

| Query param | Required | Notes |
|---|---|---|
| `redirect` | No | Where the backend sends the browser afterwards. **Must start with `/`** (relative path) or you get a `400`. Defaults to `/oauth/callback`. |

The role is only applied **when creating a brand-new user** — see §6.2 for existing
users. On the **login page**, where there's no role tile to read, always use
`/google/customer`; a brand-new account created from the login page defaults to
CUSTOMER (see §6.5). Never send `ADMIN` anywhere — admins are created server-side only,
and there is no `/google/admin` endpoint.

> 🚨 **This must be a full browser navigation, never `fetch`/`axios`.**
> ```ts
> window.location.href = `${API_URL}/api/v1/auth/google/${role.toLowerCase()}`;
> ```
> An XHR cannot follow the redirect to Google's consent screen, and the CSRF-state
> cookie the backend sets on this request would be discarded. A plain `<a href>` also
> works. If you `fetch` it, the flow silently breaks with a CORS error.

Responds `302` to `accounts.google.com`. The user picks an account there.

---

### 3.6 `GET /api/v1/auth/google/callback` — **Google calls this, you never do**

Google redirects here; the backend creates or links the user, sets the same auth
cookies as a normal login, and then `302`s the browser to **your** frontend at the
`redirect` path.

**On success** → `${APP_URL}${redirect}?role=<ROLE>&isNewUser=true`

| Param | Notes |
|---|---|
| `role` | The role actually stored on the user — `CUSTOMER`, `PROVIDER` or `ADMIN`. **May differ from what you requested** (see §6.2). Use for a fast first paint only; never for authorization. |
| `isNewUser` | `"true"` only when the account was just created. Absent for returning users. Use it to show an onboarding/welcome screen. |

**On failure** → `${APP_URL}${redirect}?error=<value>`

`error` is either a machine code or a human sentence. Handle both:

| `error` value | Meaning | Suggested UI |
|---|---|---|
| `invalid_oauth_state` | Expired (>10 min), tampered, or the flow wasn't started in this browser | "Your sign-in link expired. Please try again." |
| `google_authentication_failed` | Google rejected / user cancelled | "Google sign-in was cancelled or failed." |
| `No email found from google!` | Google account exposed no email | Show as-is |
| `Your account has been suspended. Please contact support.` | Suspended user | Show as-is |

Rule: if the value matches a known code, show your own copy; otherwise URL-decode it
and display it verbatim.

---

### 3.7 `GET /api/user/me` — the source of truth for the session

Requires the auth cookie. **This is how you learn who is logged in.**

```json
{ "success": true, "statusCode": 200, "message": "User profile retrieved successfully",
  "data": { "id": "uuid", "name": "Rezoan", "email": "a@b.com", "role": "PROVIDER",
            "status": "ACTIVE", "avatarUrl": "https://lh3.googleusercontent.com/...",
            "createdAt": "...", "updatedAt": "..." } }
```

> ⚠️ The user object is at **`data`**, not `data.user` — unlike the login endpoint.

`401` when the cookie is missing/expired → try refresh (§5), then log out if that fails.

---

## 4. Non-negotiable client rules

**1. Send credentials on every single API call.** Without this, cookies aren't attached
and everything 401s.

```ts
// fetch
fetch(url, { credentials: 'include' })

// axios — set once
axios.defaults.withCredentials = true;
```

**2. Role comes from the server, never from the URL.** `?role=` in the callback is a
display hint. All routing/authorization decisions use the `role` from
`GET /api/user/me`.

**3. Don't persist tokens.** Cookies are httpOnly; the body tokens are for non-browser
clients. Persist only the user object (or nothing, and re-fetch `/me` on load).

**4. Password max length is 20.** Enforce `6–20` in your form validation so users get a
client-side error rather than a server round-trip.

---

## 5. Suggested implementation

### 5.1 API client with automatic refresh

```ts
const API = import.meta.env.VITE_API_URL;

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = () =>
    fetch(`${API}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });

  let res = await send();

  // Access token expired → refresh once, then replay the original request.
  if (res.status === 401 && path !== '/api/v1/auth/refresh') {
    const refreshed = await fetch(`${API}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) res = await send();
  }

  const body = await res.json();
  if (!body.success) throw new Error(body.message ?? 'Request failed');
  return body.data as T;
}
```

Guard against a refresh stampede: if several requests 401 at once, share a single
in-flight refresh promise rather than firing one per request.

### 5.2 Auth store / session bootstrap

On app mount (and after any login), call `GET /api/user/me`:
- `200` → set `user`, `status: 'authenticated'`
- `401` → `user: null`, `status: 'unauthenticated'`

Keep a third `status: 'loading'` state and render nothing route-sensitive until it
resolves — otherwise protected routes flash the login page on refresh for logged-in
users.

### 5.3 The role tiles → Google

The existing Customer/Provider selector already holds the role. Wire it in:

```tsx
const [role, setRole] = useState<'customer' | 'provider'>('customer');

// Registration page — role picks the endpoint, not a query param
<button
  type="button"
  onClick={() => {
    window.location.href =
      `${API}/api/v1/auth/google/${role}?redirect=/oauth/callback`;
  }}
>
  Continue with Google
</button>

// Login page — no role tile here, so always hit /google/customer.
// For an EXISTING user this is a no-op (their stored role always wins, see §6.2);
// for a brand-new user it just means "created as CUSTOMER by default" (§6.5).
<button
  type="button"
  onClick={() => {
    window.location.href = `${API}/api/v1/auth/google/customer?redirect=/oauth/callback`;
  }}
>
  Continue with Google
</button>
```

The role does **not** need to be stored in localStorage or app state across the
redirect — it's fixed by which endpoint you navigated to, and the backend carries it
through Google in a signed `state` parameter from there.

### 5.4 New route: `/oauth/callback`

```tsx
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const error = params.get('error');
    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    const isNewUser = params.get('isNewUser') === 'true';

    // Cookies are already set; ask the server who we are.
    api<User>('/api/user/me')
      .then((user) => {
        setUser(user);
        const home = user.role === 'PROVIDER' ? '/provider/dashboard' : '/dashboard';
        navigate(isNewUser ? '/welcome' : home, { replace: true });
      })
      .catch(() => navigate('/login?error=session_failed', { replace: true }));
  }, []);

  return <FullPageSpinner label="Signing you in…" />;
}
```

Use `replace: true` so the back button doesn't return to the callback URL.
This route must be **public** — the auth guard hasn't run yet when it mounts.

### 5.5 Login page

Read `?error=` on mount and surface it as a banner — that's how the OAuth failures in
§3.6 reach the user.

---

## 6. Behaviours to get right

### 6.1 Same email, both methods
A user who registered with a password and later clicks "Continue with Google" is
**linked to the same account**, not duplicated. Nothing special to do — just don't
assume Google means "new user". Check `isNewUser`.

### 6.2 Clicked "Provider" but already a Customer
The **stored role always wins.** An existing CUSTOMER who clicks the Provider tile and
signs in with Google stays a CUSTOMER — the backend deliberately refuses to
self-upgrade roles. Route on the role from `/me`, and if it differs from the tile they
picked, show an explanatory notice ("You're signed in as a Customer. Contact support to
become a Provider.") rather than dumping them somewhere unexpected.

### 6.3 Google-only account tries the password form
Login returns `401 "This account was created with Google. Please continue with Google."`
Detect it and swap the form for a prominent Google button instead of showing a generic
password error.

### 6.4 Google-only account opens "Change password"
`PATCH /api/user/me/password` returns
`400 "This account signs in with Google and has no password to change."`
Prefer hiding the change-password UI when the user has no password — but the field
isn't exposed in the API, so handling the 400 gracefully is the practical answer.

### 6.5 New Google user on the login page
The login page's Google button hits `/google/customer` (§5.3), so a brand-new account
is created as **CUSTOMER**. Acceptable default. If you'd rather force an explicit
choice, ask the backend to add a role-onboarding endpoint — don't try to patch around
it client-side.

---

## 7. Troubleshooting

| Symptom | Cause |
|---|---|
| Login succeeds but `/me` 401s straight after | Missing `credentials: 'include'` — or, in production, the backend cookie flags (see below). Verify with DevTools → Application → Cookies. |
| CORS error when clicking Google | You used `fetch` instead of `window.location.href`. |
| `redirect_uri_mismatch` on Google's page | Backend `.env` / Google Console issue, not frontend. Report it. |
| Google signup created the wrong role | You hit `/google/customer` from the Provider tile (or vice versa) — double-check which endpoint the button navigates to. |
| `400 "You have provided incorrect field type or missing fields"` on register | You omitted `role`. |
| `?error=invalid_oauth_state` every time | Cookies blocked, or >10 min on the consent screen. Try a non-incognito window before reporting. |

**Known backend caveat:** the auth cookies are currently sent with
`secure: false; sameSite: 'none'`, which browsers reject when the frontend and API are
on different domains. Locally (`localhost:3000` → `localhost:5000`) this is same-site
and works fine. **In production this will drop the cookies and every authenticated
request will 401.** If that happens, it is a backend fix — do not work around it with
`localStorage`.

---

## 8. Definition of done

- [ ] Every auth call points at `/api/v1/auth/*`
- [ ] `credentials: 'include'` / `withCredentials: true` globally
- [ ] Register sends `role` from the selected tile, then logs the user in
- [ ] Login handles all five error cases in §3.2, incl. the Google-only 401
- [ ] Register's Google buttons hit `/google/customer` or `/google/provider` to match
      the selected tile; login's Google button always hits `/google/customer`. All as
      a full page navigation, never `fetch`/`axios`
- [ ] Public `/oauth/callback` route: reads `error` / `isNewUser`, fetches `/me`,
      routes by the **server** role, uses `replace: true`
- [ ] Login page surfaces `?error=`
- [ ] 401 → refresh → replay, with a single shared in-flight refresh
- [ ] `loading` session state so protected routes don't flash on reload
- [ ] No tokens in `localStorage`/`sessionStorage`
- [ ] Manual test: register as Provider → lands on provider dashboard; Google signup as
      Provider → provider dashboard; Google sign-in with an existing Customer account
      → customer dashboard; logout clears everything
