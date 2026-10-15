# Frontend Feature Inventory

The current Angular application is `homebudget-ui/`. Its routes are defined in `homebudget-ui/src/app/app.routes.ts`. The older root `src/` tree is a partial duplicate and is not the app selected by the root npm scripts.

Status distinguishes implementation from verification. **Implemented** means a React replacement exists; route/API checks are recorded where they ran. A full UI workflow is not marked verified without an automated interaction or browser check.

| Existing route / feature | Current behavior and caveats | React replacement | Status |
|---|---|---|---|
| `/` landing | Hero, product feature cards, analytics pitch, testimonials, pricing, FAQ, register/login links. Some marketing values are static. | Landing page with the same layout and links; preserve static marketing copy without presenting it as account data. | Implemented; Vite route smoke returned 200; visual interaction check pending |
| `/portfolio` | Static portfolio, project/skills/journey sections, theme toggle, resume/profile assets, contact opens a `mailto:` link. | Portfolio page, local assets, filter/theme behavior, contact email action. Update the project stack display to React after migration. | Implemented; route and image/resume asset smoke returned 200; interactions not browser-tested |
| `/login` | Email/password form, visibility toggle, expired-session message, redirect to dashboard. `rememberMe` is collected but unused. | API-backed login and redirect; omit the nonfunctional remember checkbox or clearly keep its original behavior documented. | Implemented; form, mocked login redirect/error, token storage/logout/expiry tests; API login/register integration tests |
| `/register` | Full name/email/password sent to API. Workspace name is stored locally. Monthly goal, currency, and notification fields are collected but not sent to the backend. | Registration against `POST /api/Auth/register`; preserve workspace name locally and save supported preferences through Settings where appropriate. Do not imply the API persisted unsupported fields. | Implemented; API registration and preference endpoints tested; registration UI interaction test pending |
| `/forgot-password`, `/reset-password` | API reset request, reset token shown as a continuation link when returned, token/email/new-password reset form. API has no email delivery provider. | Match the actual API contract and document demo token delivery as a security limitation. | Implemented; password-reset API tested; React reset UI not automated |
| `/app/dashboard` | Protected dashboard with totals, monthly/category/savings charts, suggestions, top categories, recent transactions and navigation actions. Angular supplies hardcoded fallback data on API failure and adds local generic suggestions. | Protected dashboard using `/api/Dashboard`; Recharts; real API suggestions only; explicit loading, empty and error states. | Implemented; dashboard endpoint and route smoke checked; chart rendering not browser-tested |
| `/app/transactions` | Transaction CRUD, query/category/type/date filters, client sort, server pagination, CSV export. Angular service fabricates results when calls fail. | Real CRUD and query parameters at `/api/Transactions`; surface server/network errors; preserve export and pagination. | Implemented; API service and backend CRUD/filter/export/ownership tests; React filter/pagination UI not browser-tested |
| `/app/expenses` intended page | Component exists but is not routed. It calls the transaction service as though paged results were an array. Expense-only CRUD/chart intent is clear. | Wire an expense-specific view to `/api/Transactions?type=Expense`; use actual paged results and real server writes. | Implemented; expense route smoke and shared transaction API verified; page interaction not browser-tested |
| `/app/budgets` | Budget create/edit/delete, threshold health and sorting. Period buttons are visual only; backend spent total is current-month category spend. Goal cards are read-only. | Budget CRUD with accurate current-month wording; goal create/edit via existing API; omit nonfunctional period control. There is no goal-delete endpoint. | Implemented; budget month calculation and budget/goal CRUD API tests; React forms not browser-tested |
| `/app/reports` | Monthly/yearly summary, categories and CSV/PDF exports. “Generate” refetches the same deterministic server report; extra insight and recommendation text is hardcoded. | Query `/api/Reports/summary`, use server insights and category data, preserve CSV/PDF exports, and avoid fabricated recommendations. | Implemented; report summary and CSV API endpoints checked; client PDF export not browser-tested |
| `/app/activity` | Notification metrics/grouping and mark-read action; API may seed defaults when a user has no notifications. | `/api/Notifications` list and read endpoints with loading/empty/error feedback. | Implemented; notifications list/read API integration test; UI grouping not browser-tested |
| `/app/profile` | Fetch/update name and avatar; change password; last section is static sample activity, not API data. | Profile and password APIs. Exclude static sample activity. | Implemented; profile/password API integration test; React profile form not browser-tested |
| `/app/settings` | Persisted preferences/profile/password; workspace name saved in local storage. Two-factor toggle and workspace type are not persisted; member/plan/status summary is static. | Keep supported server preferences, local workspace name/type if retained, and password change; do not present two-factor or fabricated account summary as working features. | Implemented; settings API integration test; React preferences form not browser-tested |
| App shell | Protected navigation, collapse preference, theme preference, desktop sidebar/mobile bar, notification/settings/profile/logout actions. Header search is decorative and has no handler. | Protected layout with responsive navigation and persisted collapse/theme; remove inactive search affordance. | Implemented; protected route URLs return SPA shell; mobile/desktop visual check pending |
| Toasts | Success/error/warning/info toast with dismiss/timed removal. | Accessible React toast context/provider. | Implemented; exercised through auth/page code; toast interactions not directly tested |

## Angular source inventory

The inspected application uses Angular standalone components; no feature `NgModule`, custom `@Pipe`, or custom `@Directive` declarations were found.

- **Bootstrap and routes:** `src/main.ts`, `app/app.ts`, `app/app.html`, `app/app.css`, `app/app.config.ts`, and `app/app.routes.ts`. The app config registers the router, HTTP client/interceptor, global error listeners, and the Lucide icon set.
- **Standalone components:** root app, shell, landing, portfolio, login, register, forgot/reset password, dashboard, transactions, budgets, expenses, reports, activity, profile, settings, and toast container.
- **Templates and component styles:** landing/auth/activity/budgets/reports/profile are primarily inline; separate `.html` and `.css` files exist for app shell/root, login/register, portfolio, dashboard, expenses, transactions, and settings. Global styling is in `src/styles.css`.
- **Auth/core:** `core/auth.service.ts`, `core/auth-guard.ts` (the route actually imports this file), and `core/auth.interceptor.ts` (registered by `app.config.ts`). `core/auth.guard.ts` and `interceptors/auth-interceptor.ts` are duplicate/unused implementations; the latter has a separate interceptor spec.
- **API services:** `services/api.service.ts` is used by feature components and supplies synthetic demo fallbacks on request failures. `services/api.ts` contains an empty injectable `Api` and is unused.
- **Shared behavior:** `shared/toast.service.ts` and `shared/toast-container.component.ts`; there are no shared custom pipes/directives.
- **Existing Angular specs:** app, guard, interceptor, dashboard, and API service specs. They do not cover the full feature set or end-to-end CRUD.
- **Environment/assets:** `src/environments/environment.ts` points to `https://localhost:44317/api`; `environment.prod.ts` points to the Render API. Assets include the finance video and profile image in two source locations. Existing styling and legal/profile assets were reused where applicable.
- **Other incomplete/unused source:** `pages/expenses/expenses.component.ts` is present but absent from `app.routes.ts`; root `src/` plus root Angular config form a partial duplicate and are not the supported app.

The React app keeps its own feature modules and does not remove any Angular file. The actual dependency and build definitions remain in `homebudget-ui/package.json`, `homebudget-ui/angular.json`, and `homebudget-ui/package-lock.json`.

## Cross-cutting behavior

- Authentication currently uses a 12-hour JWT and 14-day refresh token. Angular stores both tokens and a user object in `localStorage`; no refresh-token endpoint is called by Angular.
- Backend enum JSON values are the strings `Income` and `Expense`.
- Financial amounts are decimal values; do not coerce or round them during transport. Format only for display.
- Backend dates are serialized as ISO date/time values. Date form inputs represent local calendar dates; preserve the selected date when converting to the API's UTC date format.
- The `Category` database entity has no category controller. Existing transaction categories are free text with HTML suggestions, not server-managed categories.
- The compatibility `ExpenseController` returns an empty page. The working expense data contract is the filtered Transactions endpoint.

## Current known gaps to track

- No backend automated test project exists on the audited branch.
- Angular API fallback data obscures failures; React must not carry that behavior forward.
- Registration form fields `monthlyGoal`, currency, and notifications were not sent by Angular registration.
- Two-factor UI has no backend endpoint; do not expose it as an active security control.
- Budget period tabs do not currently filter data; avoid claiming they do.
- The report's static extra recommendations and profile's sample activity are not backend features.
- Goals have list/create/update API support; no delete route exists.
