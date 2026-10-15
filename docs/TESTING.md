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

- Frontend tests cover currency/date helpers, transaction API route/query/error behavior, login validation/redirect/API failure rendering, auth token storage/logout/expiration, and production API URL validation (17 tests across 5 files).
- API integration tests exercise real HTTP routes through `WebApplicationFactory` against an isolated in-memory SQLite connection. They cover login/registration, CORS, unauthorized access, transaction validation/CRUD/export/user isolation, budget CRUD and month-specific totals, savings goal create/update, password reset, reports/CSV, notifications, settings, profile, and password change (6 tests).
- Vite production build and ESLint checks catch bundling and static-quality errors.

The automated tests do not touch `HomeBudgetAPI/homebudget-local.db` or any deployed database. A separate HTTP smoke run used an isolated SQLite file under the system temp directory and verified registration, transaction, dashboard, budget, goal, report, settings, and profile responses. A Vite server smoke check returned HTTP 200 for all public/protected route URLs and the portfolio image/resume; the API returned the configured localhost CORS origin. These checks do not verify external PostgreSQL availability, production CORS, or email delivery. Browser-rendered visual checks and automated browser end-to-end flows were not run because browser automation was unavailable in this session.

## Current result

Results in this checkout: `npm ci` completed with 0 reported vulnerabilities; `npm run lint` passed; `npm test` passed 17/17; `npm run build` passed; the GitHub Pages base-path build and fallback check passed; `dotnet build` passed with 0 warnings/errors; and `dotnet test` passed 6/6.
