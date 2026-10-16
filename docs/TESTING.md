# Testing

## Commands

Run the frontend checks from the repository root after installing its lockfile dependencies:

```powershell
npm --prefix frontend-react ci
npm run lint
npm test
npm run build
```

Run API checks from the repository root:

```powershell
dotnet restore homebudgetai-fullstack.sln
dotnet build homebudgetai-fullstack.sln -c Release
dotnet test homebudgetai-fullstack.sln -c Release
```

## Coverage

- Frontend tests cover currency/date helpers, transaction API route/query/error behavior, login and registration validation/API behavior, auth token storage/logout/expiration, safe API-origin authorization headers, API error messages, and production API URL validation (31 tests across 8 test files; the URL guard runs as a second Vitest command).
- API integration tests exercise real HTTP routes through `WebApplicationFactory` against an isolated in-memory SQLite connection. They cover login/registration validation, duplicate accounts, invalid/expired JWTs, legacy password hash upgrades, malformed password hashes, CORS, unauthorized access, transaction validation/CRUD/export/user isolation, contact validation, budget CRUD and month-specific totals, savings goal create/update, non-disclosing password recovery, valid and invalid report queries/CSV, notifications, settings, profile, password change, and refresh-token revocation (11 tests).
- Vite production build and ESLint checks catch bundling and static-quality errors.

The automated tests use an isolated in-memory SQLite connection and do not touch `HomeBudgetAPI/homebudget-local.db` or a deployed database. A local browser walkthrough completed registration, login, settings update, transaction create/read/update/delete, logout, and login again against a separate disposable SQLite database. It used a generated test identity and did not access deployed data. On 2026-10-16, Render health returned 200 after the first request timed out at 30 seconds; CORS preflights from both intended frontend origins returned 204 without allow headers. Both live frontend bundles still point to `http://localhost:5033/api`, so production browser API requests remain unverified. The Vercel alias serves React assets, but its configured API target is unverified.

## Current result

Final local verification: `npm ci` passed and reported zero npm vulnerabilities; frontend lint passed; frontend tests passed 31/31 (26 tests plus five production API URL guard tests); and the production build passed with `VITE_API_BASE_URL=https://homebudgetai-fullstack-2.onrender.com/api`. `dotnet restore` passed; the Release solution build passed with 0 warnings/errors; the API integration suite passed 11/11; and NuGet audits reported no vulnerable packages for the API or test project. `git diff --check` passed. Live production preflights and bundles still show the CORS/API URL configuration issue described above; no production deployment was performed.
