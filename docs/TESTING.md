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
- API integration tests exercise real HTTP routes through `WebApplicationFactory` against an isolated in-memory SQLite connection. They cover login/registration, CORS, unauthorized access, transaction validation/CRUD/export/user isolation, budget CRUD and month-specific totals, savings goal create/update, non-disclosing password recovery, reports/CSV, notifications, settings, profile, password change, and refresh-token revocation (7 tests).
- Vite production build and ESLint checks catch bundling and static-quality errors.

The automated tests do not touch `HomeBudgetAPI/homebudget-local.db` or any deployed database. A local browser render confirmed the React registration page and the navy/cobalt/violet theme. Production HTTP checks found Render health returns 200, but preflight responses from both intended frontend origins omit CORS allow headers; the live Netlify and GitHub Pages React bundles still point to `http://localhost:5033/api`. The Vercel alias serves React assets, but its configured API target is unverified. These findings do not establish successful production browser requests. Full browser registration/login and authenticated API flows were not automated.

## Current result

Current verification: `npm run lint` passed; `npm test` passed 31/31 (26 frontend tests plus five production API URL guard tests); `npm run build` passed with `VITE_API_BASE_URL=https://homebudgetai-fullstack-2.onrender.com/api`; building without that variable failed early with the expected setup message; the generated bundle contains the Render API URL and no localhost API URL; `dotnet build homebudgetai-fullstack.sln --configuration Release` passed with 0 warnings/errors; and `dotnet test homebudgetai-fullstack.sln --configuration Release` passed 7/7.
