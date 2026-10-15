# HomeBudgetAI

HomeBudgetAI is a household finance application with a React single-page frontend, an ASP.NET Core Web API, and Entity Framework Core data access.

## Features

- JWT registration, login, protected routes, and logout on token expiry
- Dashboard with account summaries, monthly/category charts, and API-provided insights
- Income and expense transactions with search, filters, sorting, pagination, CSV export, and CRUD
- Monthly budgets and savings goals
- Monthly/yearly reports with CSV and PDF export
- Notifications, profile, password change, and supported account preferences
- Responsive navigation and light/dark themes

## Project structure

    frontend-react/      React 19 + Vite + React Router + Axios + Recharts
    HomeBudgetAPI/       ASP.NET Core 8 API + EF Core
    HomeBudgetAPI.Tests/ API integration tests using isolated SQLite
    docs/                API, architecture, feature, security, and deployment notes

The API remains the source of truth for financial data. The frontend does not replace failed API responses with demo finance values. See docs/ARCHITECTURE.md, docs/FEATURE_INVENTORY.md, and docs/API_INVENTORY.md for details.

## Prerequisites

- Node.js 20.19 or newer and npm 11.6.0
- .NET 8 SDK
- Git
- SQLite for local development; PostgreSQL or SQL Server can be configured for hosted environments

## Run locally

### API

From the repository root, configure a local signing key with .NET user secrets:

    cd HomeBudgetAPI
    dotnet user-secrets set "Jwt:Key" "<a-long-random-signing-key>"
    dotnet user-secrets set "Jwt:Issuer" "HomeBudgetAI"
    dotnet user-secrets set "Jwt:Audience" "HomeBudgetAI.Users"
    dotnet restore
    dotnet run

The API launch profile uses http://localhost:5033; Swagger is at /swagger. The default SQLite provider uses HomeBudgetAPI/homebudget-local.db. Development seeding is enabled by the development settings.

### React frontend

In a second terminal, from the repository root:

    cd frontend-react
    npm ci
    Copy-Item .env.example .env.local
    npm run dev

Vite runs at http://localhost:5173 and calls http://localhost:5033/api by default. Set VITE_API_BASE_URL in frontend-react/.env.local when the API uses another URL. Vite-prefixed values are public browser configuration and must not contain secrets.

Root shortcuts also delegate to the React app: npm run dev, npm run build, npm run lint, and npm test.

## Configuration

The root .env.example and frontend-react/.env.example contain non-secret examples. Backend settings use standard ASP.NET Core environment variables or .NET user secrets.

| Setting | Purpose |
|---|---|
| DatabaseProvider | Sqlite, PostgreSQL, or SqlServer |
| ConnectionStrings__DefaultConnection | Provider-specific connection string |
| Jwt__Key | Private signing key; use user secrets locally and a secret environment setting in deployment |
| Jwt__Issuer, Jwt__Audience | JWT validation values |
| Cors__AllowedOrigins__0 | First allowed frontend origin |
| SeedDemoData | Explicitly enable seed data outside development |

## Checks

    npm --prefix frontend-react ci
    npm run lint
    npm test
    npm run build
    dotnet restore homebudgetai-fullstack.sln
    dotnet build homebudgetai-fullstack.sln -c Release
    dotnet test homebudgetai-fullstack.sln -c Release

API integration tests use an isolated SQLite database and do not use the local or production database. See docs/TESTING.md.

## Deployment

Netlify builds and publishes the React app from frontend-react/. GitHub Pages uses a base-path-aware build and SPA fallback from main. Render deploys the .NET API separately and requires a valid database connection, JWT secret, and exact CORS origin. A local build does not confirm a live deployment. See docs/DEPLOYMENT.md.

## Known limitations

- Password reset is a demo flow: the API returns a token for known users and has no email delivery provider.
- Access tokens and user data remain in browser local storage to match the existing bearer-token API.
- The two-factor control, budget-period selector, report-generated AI recommendations, and static profile activity are not presented as working features because the API does not support them.
- Savings goals support create/read/update; the API has no delete route.
- SQLite and PostgreSQL startup use EnsureCreatedAsync; SQL Server retains its existing migrations. Existing hosted schemas and connectivity require environment-specific verification.

## License

MIT. See LICENSE.