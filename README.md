# HomeBudgetAI

HomeBudgetAI is a household finance application with a React single-page frontend, an ASP.NET Core Web API, and Entity Framework Core data access. The original Angular application remains in the repository as a recovery/reference implementation while the React migration is reviewed.

## Features

- JWT registration, login, protected routes, and logout on token expiry
- Dashboard with account summaries, monthly/category charts, and API-provided insights
- Income and expense transactions with search, filters, sorting, pagination, CSV export, and CRUD
- Monthly budgets and savings goals
- Monthly/yearly reports with CSV and PDF export
- Notifications, profile, password change, and supported account preferences
- Responsive navigation and light/dark themes

## Architecture

```text
frontend-react/      React 19 + Vite + React Router + Axios + Recharts
HomeBudgetAPI/       ASP.NET Core 8 API + EF Core 9
HomeBudgetAPI.Tests/ API integration tests using isolated in-memory SQLite
homebudget-ui/       Preserved Angular application
```

The API remains the source of truth for financial data. React does not replace failed API responses with demo finance values. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/FEATURE_INVENTORY.md](docs/FEATURE_INVENTORY.md), and [docs/API_INVENTORY.md](docs/API_INVENTORY.md) for the migration mapping and contracts.

## Prerequisites

- Node.js 20.19 or newer and npm 11.6.0
- .NET 8 SDK
- Git
- SQLite for local development (included through the EF Core provider); PostgreSQL or SQL Server can be configured for hosted environments

## Configure and run locally

### API

From the repository root, configure a local signing key through .NET user secrets. Do not put it in Vite variables or commit it:

```powershell
cd HomeBudgetAPI
dotnet user-secrets set "Jwt:Key" "<a-long-random-signing-key>"
dotnet user-secrets set "Jwt:Issuer" "HomeBudgetAI"
dotnet user-secrets set "Jwt:Audience" "HomeBudgetAI.Users"
dotnet restore
dotnet run
```

The API launch profile uses `http://localhost:5033`; Swagger is at `/swagger`. The default `Sqlite` provider uses `HomeBudgetAPI/homebudget-local.db` when launched from this folder. Back up an existing database before changing provider or schema configuration. Development seeding is enabled by the existing development settings.

To use a separate SQLite file for a local check, set `ConnectionStrings__DefaultConnection` to a new path before starting the API. To choose a provider, set `DatabaseProvider` to `Sqlite`, `PostgreSQL`, or `SqlServer`, with a matching connection string.

### React frontend

In a second terminal, from the repository root:

```powershell
cd frontend-react
npm ci
Copy-Item .env.example .env.local
npm run dev
```

The Vite app runs at `http://localhost:5173` and calls `http://localhost:5033/api` by default. Set `VITE_API_BASE_URL` in `frontend-react/.env.local` to the API's `/api` base URL when it differs. Vite-prefixed variables are public browser configuration and must never contain secrets.

Root-level shortcuts (`npm run dev`, `npm run build`, `npm run lint`, and `npm test`) delegate to the React app after its dependencies are installed. `npm run legacy:dev`, `npm run legacy:build`, and `npm run legacy:test` access the preserved Angular app.

## Configuration

The root `.env.example` and `frontend-react/.env.example` contain non-secret frontend examples. Backend configuration is provided by standard ASP.NET Core environment variables or .NET user secrets:

| Setting | Purpose |
|---|---|
| `DatabaseProvider` | `Sqlite`, `PostgreSQL`, or `SqlServer` |
| `ConnectionStrings__DefaultConnection` | Provider-specific connection string |
| `Jwt__Key` | Required private signing key; user secrets locally, secret environment setting in deployment |
| `Jwt__Issuer`, `Jwt__Audience` | JWT validation values |
| `Cors__AllowedOrigins__0` | First allowed frontend origin; add indexed entries for additional origins |
| `SeedDemoData` | Explicitly enable seed data outside development |

Development CORS permits Vite and the legacy Angular dev server. Production CORS must be configured with the exact deployed frontend origin. See [docs/SECURITY.md](docs/SECURITY.md).

## Tests and production build

```powershell
npm --prefix frontend-react ci
npm run lint
npm test
npm run build
dotnet restore homebudgetai-fullstack.sln
dotnet build homebudgetai-fullstack.sln -c Release
dotnet test homebudgetai-fullstack.sln -c Release
```

API integration tests use an isolated in-memory SQLite connection and do not use the local or production database. Read [docs/TESTING.md](docs/TESTING.md) for scope and limitations.

## Deployment

Netlify builds the Vite app from `frontend-react/` and uses the SPA fallback in `frontend-react/public/_redirects`. GitHub Pages uses a base-path-aware build and a 404 fallback. Both are configured for the React app; GitHub Pages only deploys from `main`. The .NET API is configured separately through Render and needs a valid PostgreSQL connection, JWT secret, and exact CORS origin. No deployment is performed by this migration branch. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) before publishing.

## Known limitations

- Password reset is a demo flow: the API returns a token for known users and has no email delivery provider.
- Access and refresh tokens are stored in browser local storage to match the existing bearer-token API; injected scripts can read them. HttpOnly cookies require a separately designed backend flow.
- The two-factor control, budget period selector, report-generated AI recommendations, and static profile activity in Angular were not backed by real APIs and are not presented as working features.
- Savings goals support create/read/update; the API has no delete route.
- SQLite and PostgreSQL startup use `EnsureCreatedAsync`; SQL Server retains its existing migrations. Existing schemas and live hosted connectivity need environment-specific verification.

## License

MIT. See [LICENSE](LICENSE).
