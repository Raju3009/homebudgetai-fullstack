# Architecture

## Existing checked-out application

```text
Angular SPA (`homebudget-ui/`, port 4200)
  ├── Angular Router / auth guard / HTTP interceptor
  ├── API service (currently substitutes demo objects on many failures)
  └── Chart.js and custom responsive CSS
            │ HTTP + Bearer JWT
            ▼
ASP.NET Core 8 (`HomeBudgetAPI/`, port from launch settings)
  ├── Controllers + DTO records
  ├── JWT authentication / role authorization / rate limiting
  ├── transaction repository + insight service
  └── EF Core 9 (`AppDbContext`)
            │
            ├── SQLite local (`EnsureCreatedAsync`, ignored DB file)
            ├── SQL Server (SQL Server migration files)
            └── PostgreSQL explicitly selected by `DatabaseProvider` (hosted connectivity unverified)
```

The root `package.json` delegates development/build/lint/test commands to `frontend-react/`; `legacy:*` scripts retain the nested Angular app commands. Root `src/` and `angular.json` contain a partial duplicate. Netlify and GitHub Pages are configured to build React. Render runs the .NET Docker image with PostgreSQL settings.

## Target application

```text
React SPA (`frontend-react/`, Vite)
  ├── React Router SPA routes + protected app layout
  ├── Auth context and centralized Axios client
  ├── API service modules per backend resource
  ├── Recharts dashboard visuals
  └── custom CSS adapted from the current Angular global styles
            │ HTTP + Bearer JWT
            ▼
Existing ASP.NET API and EF model
```

The React frontend is a separate directory. Angular sources and their lockfile remain available as a recovery path. The React app uses the API's real DTOs and does not synthesize financial data after failed requests. Financial amounts remain numeric decimal values in JSON and use user-selected currency for display; date-only form values are converted consistently for the API.

## Authentication boundary

- Public routes: landing, portfolio, login, register, forgot password, reset password.
- `/app/*` uses a route guard based on the in-memory auth context plus existing local token session.
- Axios adds the bearer token only to the configured API origin. A 401 clears auth state and returns to login; 403 remains an authorization error.
- The API returns an access token and refresh token. React keeps the access token and cached user compatible with the existing local-storage session, does not persist the unused refresh token, and clears the session after a 401. Browser storage remains readable by injected scripts. HttpOnly cookie support would require a backend auth/CORS design change.
- Role data can control user-facing affordances, but backend authorization remains authoritative.

## API and data boundaries

- `src/api/client.js` owns base URL, timeout, auth header, response errors, and cancellation behavior.
- `src/api/*` modules own endpoint and payload contracts.
- React Context owns auth/theme/toast state; financial resources use local page state and reload after successful server mutations.
- The backend remains the source of truth. No client-side fallback dataset is used.
- No schema reset/migration is planned. Local integration tests use a temporary SQLite database, not the ignored user DB.

## Deployment target

- Netlify SPA: build `frontend-react/` and use its `public/_redirects` fallback.
- GitHub Pages: use a base-path-aware build and client-side fallback; deployment remains main-only and requires a production API URL.
- Render: preserve the configured PostgreSQL environment with explicit provider selection. SQLite and PostgreSQL use `EnsureCreatedAsync`; SQL Server keeps its existing migrations. Do not claim Render data connectivity until a safe database-backed request is verified.
- CORS allows explicit configured origins; development defaults include Vite and the retained Angular dev origin. Production must set the exact deployed frontend origin; wildcard credentialed CORS is not enabled.

## Known security limits

- Bearer tokens in browser storage are readable by injected scripts; migration cannot make them HttpOnly without a backend cookie-flow redesign.
- Forgot password is demo delivery and returns a reset token in the API response for known accounts.
- Two-factor UI has no backend implementation.
- The audited branch had a tracked JWT signing value and exception middleware that returned details. The migration removes the tracked value from configuration and returns generic 500 responses while keeping server logs.
