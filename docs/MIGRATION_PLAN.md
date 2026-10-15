# Angular to React Migration Plan

## Scope and checkout

- Repository: `https://github.com/Raju3009/homebudgetai-fullstack.git`
- Verified base: `origin/main` at `89f82dd7eee52ea5fd2407a2b632a83930778ac1` (2026-09-18)
- Working branch: `feature/angular-to-react-migration`
- The configured `D:\HomeBudgetAI` path is absent. The clean Git checkout is `C:\Users\coolg\homebudgetai-fullstack`; `D:\Project\homebudgetai-fullstack-main` is a source archive without Git metadata.
- The supported Angular app is `homebudget-ui/`. The repository also has an incomplete duplicate Angular `src/` and root Angular configuration. Keep both intact until React verification.

## Audit findings

1. Frontend routes and user-visible features are catalogued in [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md).
2. API routes, DTOs, database entities, and access rules are catalogued in [API_INVENTORY.md](API_INVENTORY.md).
3. Existing architecture and deployment gaps are in [ARCHITECTURE.md](ARCHITECTURE.md).
4. There is no backend test project. Existing Angular tests are limited to app, guard, interceptor, dashboard, and API stubs.
5. Angular's API service returns synthetic demo data for many HTTP failures. React must show the real error and must not report failed writes or exports as successful.
6. Render requests PostgreSQL, but the checked-out API currently handles SQLite explicitly and routes every other provider to SQL Server. Fix provider selection without dropping or recreating existing databases.
7. `HomeBudgetAPI/appsettings.json` contains a committed JWT signing value, and exception middleware returns exception details to clients. Remove the committed signing value and return a generic error body while retaining server-side logging.

## Implementation stages

| Stage | Work | State |
|---|---|---|
| 1 | Audit Angular routes/pages, API contracts, data model, tests, Git and deployment | PASS — documented before implementation |
| 2 | Add `frontend-react/` with Vite, React, React Router, Axios, Recharts, lint and test scripts | Implemented; verification pending |
| 3 | Migrate landing/auth/portfolio and protected app shell | Implemented; verification pending |
| 4 | Migrate dashboard, transaction and expense workflows, budgets/goals, reports, activity, profile and settings | Implemented; routes served and core financial flows API-smoke-tested; browser workflow checks pending |
| 5 | Integrate every request with the inspected ASP.NET contracts; remove fake fallback responses | Implemented; API integration tests and isolated end-to-end HTTP smoke passed |
| 6 | Correct React CORS and PostgreSQL provider startup; remove tracked JWT signing value and hide exception details | Implemented; SQLite startup/CORS verified, PostgreSQL deployment remains unverified |
| 7 | Add focused frontend and backend tests; run lint, tests, frontend production build, backend build and isolated API checks | PASS — 12 frontend tests, 5 API tests, lint/builds, and isolated SQLite HTTP smoke checks |
| 8 | Update setup/security/testing/deployment documentation and switch deployment configuration to the React build | PASS — docs, Netlify, Pages, and CI point to the React app |
| 9 | Review diff/secrets, preserve Angular, and report branch/push/deployment state | PASS — diff checks clean, no signing key in appsettings, Angular sources unchanged; local branch only |

## Verification rules

- Do not delete Angular source or run a schema drop/reset.
- Use a separate test database for API integration checks. Do not point tests at the ignored local database or production.
- A feature is marked complete in the inventory only after the mapped workflow has a verification result.
- Deployment, push, and pull request remain separate from local implementation. No GitHub push or deployment is part of this local branch work.

## Final gate

The final report will list each quality-gate item as PASS, FAIL, BLOCKED, or NOT RUN with concrete evidence. Production database connectivity and a live deployment cannot be marked PASS without deployment credentials and a safe production verification path.
