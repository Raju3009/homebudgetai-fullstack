# Security notes

## Changes in this migration

- Removed the committed JWT signing value from `HomeBudgetAPI/appsettings.json`. Use .NET user secrets locally and deployment secrets in hosted environments.
- Exception responses now contain a generic message and trace ID; details remain in server logs.
- CORS uses configured explicit origins and does not enable credentialed wildcard access. Development defaults include the localhost Vite origins; set exact HTTPS origins for production.
- API startup now fails when database initialization fails instead of serving requests against an uninitialized store.
- React API requests attach bearer tokens only to the configured API origin, and a 401 clears the session. A 403 remains an authorization error.
- API startup rejects a signing key shorter than 32 UTF-8 bytes or missing issuer/audience values. Password changes and resets revoke active refresh tokens.
- Passwords use salted PBKDF2-HMAC-SHA256 with 600,000 iterations. Existing lower-cost hashes are upgraded after a successful login; malformed stored hashes fail as invalid credentials.
- Updated `SQLitePCLRaw.lib.e_sqlite3` to 2.1.14 to resolve the reported transitive SQLite native library advisory; current API and test-project NuGet audits report no vulnerable packages.
- Demo seeding is disabled by default. Enabling it requires a private password setting, and the seeded account has the regular User role.
- Public contact submissions use a bounded request contract; clients cannot set database IDs or timestamps.

## Existing constraints and remaining risks

- The original JWT signing value exists in earlier repository history. If it was ever used by a deployed service, treat it as exposed and rotate it before deployment; removing it from the current file does not rewrite Git history.
- The current API uses bearer access and refresh tokens. The React app preserves the existing local-storage-compatible access token session and does not call the refresh endpoint. Browser storage is readable by injected scripts, including an XSS payload. This is not equivalent to HttpOnly cookie storage.
- Password recovery returns a generic 503 until an email provider is configured. It does not reveal account existence or reset tokens.
- `Jwt:Key` must be supplied in every environment. It must contain at least 32 UTF-8 bytes; issuer and audience must also be configured. Do not use a `VITE_` variable for the key.
- PostgreSQL provider selection is implemented, but deployed connectivity and schema compatibility are unverified. Existing user data has not been migrated or modified by these local checks.
- The API uses rate limiting and ownership checks. Production database connectivity and schema compatibility still require environment-specific verification.

## Local setup

Set the API signing key through user secrets from the `HomeBudgetAPI` directory:

```powershell
dotnet user-secrets set "Jwt:Key" "<a-long-random-signing-key>"
```

Optional local demo seeding is disabled by default. Enable it only when needed and provide a private password:

```powershell
dotnet user-secrets set "SeedDemoData" "true"
dotnet user-secrets set "SeedDemoPassword" "<a-private-password-of-at-least-12-characters>"
```

Keep `.env.local`, production connection strings, JWT values, and access tokens out of source control. The repository ignores `.env` files and local SQLite databases.
