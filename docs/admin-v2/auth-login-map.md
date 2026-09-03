# Admin Login Map

## Endpoint

Admin login is handled by `POST /api/admin/login` in `app/api/admin/login/route.ts`.

The shared login page is `/admin/login` and accepts a `next` query parameter for both Admin V1 and Admin V2 destinations.

## Request Format

The endpoint accepts:

- `application/json`
- `application/x-www-form-urlencoded`
- `multipart/form-data`

Expected fields:

- `username`
- `password`
- `next` optional internal destination

Malformed JSON/form bodies return `400`. Missing username or password returns `400`. Invalid credentials return `401`.

## Response Format

Successful JSON response:

```json
{
  "ok": true,
  "next": "/admin-v2"
}
```

Staff login responses also include staff role metadata. Owner development fallback responses include `isDevelopmentFallback: true` when the fallback is active.

## Session Cookie

The route creates the session with `createAdminSessionToken()` from `app/lib/admin-auth.ts` and sets the exact cookie read by `getAdminSession()`:

- name: `aevyrixa_admin_session`
- `httpOnly: true`
- `sameSite: "lax"`
- `secure: true` in production
- `path: "/"`
- max age: 8 hours

The cookie value uses the existing signed `v1` session payload format. Secrets and passwords are never logged by the login route.

Logout is handled by `POST /api/admin/logout`, which clears the same cookie name at path `/`.

## Credential Source

Environment credentials from `ADMIN_USERNAME` and `ADMIN_PASSWORD` take priority.

The development fallback credentials are:

- username: `admin`
- password: `admin`

The fallback is available only when `process.env.NODE_ENV !== "production"`. Production returns no fallback credentials when the environment variables are missing.

Staff login remains delegated to the existing `authenticateStaff()` path and does not create a second authentication system.

## Safe Next Redirects

`next` is accepted only when it is an internal admin path:

- `/admin`
- `/admin/...`
- `/admin-v2`
- `/admin-v2/...`

External URLs, protocol-relative URLs, backslash paths, and unrelated internal paths fall back to `/admin-v2`.
