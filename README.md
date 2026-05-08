# HomeBudgetAI Full Stack

Production-style home budget SaaS built with Angular 21 and ASP.NET Core .NET 8. HomeBudgetAI combines secure JWT authentication, transaction management, analytics dashboards, profile settings, PostgreSQL/SQL Server data support, and deployment-ready Netlify/Render/GitHub Actions configuration.

## Live Links

- GitHub repository: https://github.com/Raju3009/homebudgetai-fullstack
- Frontend: https://raju3009.github.io/homebudgetai-fullstack/ or your Netlify site URL
- Backend API: https://homebudgetai-api.onrender.com
- Swagger: https://homebudgetai-api.onrender.com/swagger

Update the frontend production API URL and CORS origin to match the final deployed domains before the public launch.

## Demo Credentials

```text
Email: demo@homebudget.ai
Password: Demo@12345
Role: Admin
```

## Features

- JWT login, registration, forgot-password and reset-password demo flow.
- Remember-me session persistence with local/session storage, token expiration checks, guarded routes, role helper guard, and automatic 401 logout redirects.
- Financial dashboard with income, expenses, balance, savings rate, monthly bar chart, category doughnut chart, recent transactions, category breakdown, skeleton loading, and AI-style budget suggestions.
- Income and expense CRUD with create/edit/delete, search, pagination, category/type/date filters, validation, loading/error states, delete confirmation, and authenticated CSV export.
- Profile page with full name, email, avatar URL, change password, and dark/light mode toggle in the app shell.
- ASP.NET Core API with DTOs, repository pattern, async EF Core APIs, global exception middleware, Swagger with bearer auth, CORS policy, PBKDF2 password hashing, demo seed user, SQL Server local support, and PostgreSQL production support.
- Deployment config for Netlify frontend, Render backend, Docker API image, and GitHub Actions build/deploy validation.

## Screenshots

Add screenshots after deployment:

```text
/screenshots/dashboard.png
/screenshots/transactions.png
/screenshots/auth.png
```

Suggested capture points: login page, dashboard charts, transaction management, and profile settings.

## Tech Stack

Frontend:

- Angular 21 standalone components
- Reactive forms and route guards
- Tailwind CSS 3, Bootstrap 5, custom CSS
- Chart.js
- RxJS and Angular HTTP interceptors

Backend:

- ASP.NET Core Web API (.NET 8)
- Entity Framework Core
- SQL Server for local development
- PostgreSQL via Npgsql for production
- JWT bearer authentication
- Swagger/OpenAPI
- Docker

## Project Structure

```text
HomeBudgetAPI/             ASP.NET Core API
homebudget-ui/             Primary Angular frontend used by Netlify and GitHub Pages
src/                       Legacy/root Angular source retained for root build compatibility
.github/workflows/         Frontend Pages and backend CI workflows
netlify.toml               Netlify frontend deployment config
render.yaml                Render backend blueprint
.env.example               Production environment variable template
```

## Local Setup

Prerequisites:

- Node.js 20+ or 22+
- npm
- .NET 8 SDK
- SQL Server LocalDB, SQL Server, or PostgreSQL

Backend:

```bash
cd HomeBudgetAPI
dotnet restore
dotnet run
```

Default local API: `https://localhost:44317/api` or the URL printed by `dotnet run`.

Frontend:

```bash
cd homebudget-ui
npm ci
npm start
```

Open `http://localhost:4200`.

## Environment Variables

Backend production variables:

```text
ASPNETCORE_ENVIRONMENT=Production
DatabaseProvider=PostgreSQL
ConnectionStrings__DefaultConnection=Host=...;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true
Jwt__Key=replace-with-a-64-character-minimum-production-secret
Jwt__Issuer=HomeBudgetAI
Jwt__Audience=HomeBudgetAI.Users
Cors__AllowedOrigins__0=https://your-netlify-site.netlify.app
Cors__AllowedOrigins__1=https://raju3009.github.io
```

Frontend production API URL:

```ts
// homebudget-ui/src/environments/environment.prod.ts
apiUrl: 'https://homebudgetai-api.onrender.com/api'
```

For GitHub Pages or Netlify, rebuild the frontend after changing this URL.

## Production Builds

```bash
cd HomeBudgetAPI
dotnet build -c Release

cd ../homebudget-ui
npm run build -- --configuration production
```

Angular output: `homebudget-ui/dist/homebudget-ui/browser`.

Root compatibility build:

```bash
npm run build -- --configuration production
```

## Deployment Guide

### Backend on Render

1. Create a PostgreSQL database on Render, Neon, Supabase, Railway, or Supabase.
2. Create a Render Blueprint from `render.yaml`, or create a Web Service manually with root directory `HomeBudgetAPI`.
3. Set `DatabaseProvider=PostgreSQL`.
4. Set `ConnectionStrings__DefaultConnection` to the production PostgreSQL connection string.
5. Set `Jwt__Key`, `Jwt__Issuer`, `Jwt__Audience`, and `Cors__AllowedOrigins__0`.
6. Deploy and verify `GET /api/health` and `/swagger`.

The API creates the schema and seed demo account on first startup with `EnsureCreatedAsync`.

### Frontend on Netlify

Netlify reads `netlify.toml`:

```text
Base directory: homebudget-ui
Build command: npm ci && npm run build -- --configuration production
Publish directory: dist/homebudget-ui/browser
```

SPA routing is handled by `netlify.toml` redirects.

### Frontend on GitHub Pages

The workflow `.github/workflows/frontend-pages.yml` builds `homebudget-ui` and publishes `dist/homebudget-ui/browser`.

1. In GitHub Settings -> Pages, set Source to `GitHub Actions`.
2. Push to `main` or run the workflow manually.
3. Expected URL: `https://raju3009.github.io/homebudgetai-fullstack/`.

### Backend CI / Docker

`.github/workflows/backend-ci.yml` restores, builds, and Docker-builds the .NET API on backend changes.

## API Documentation

Swagger is available at `/swagger`.

Key endpoints:

- `POST /api/Auth/register`
- `POST /api/Auth/login`
- `POST /api/Auth/forgot-password`
- `POST /api/Auth/reset-password`
- `GET /api/Auth/me`
- `GET /api/Dashboard`
- `GET /api/Transactions?q=&category=&type=&from=&to=&page=&pageSize=`
- `POST /api/Transactions`
- `PUT /api/Transactions/{id}`
- `DELETE /api/Transactions/{id}`
- `GET /api/Transactions/export`
- `PUT /api/Profile`
- `POST /api/Profile/change-password`
- `GET /api/Health`

## Verification Completed

- Angular nested production build passes.
- Angular root compatibility production build passes.
- ASP.NET Core Release build passes with 0 warnings and 0 errors.
- JWT enum serialization fixed for Angular compatibility.
- Authenticated CSV export verified at build/contract level.

## Troubleshooting

- If Angular cannot call the API, verify `environment.prod.ts` and backend CORS origins.
- If production login fails, verify `Jwt__Key`, `Jwt__Issuer`, and `Jwt__Audience`.
- If Render database startup fails, confirm `DatabaseProvider=PostgreSQL` and a reachable Npgsql connection string.
- If GitHub Pages loads but refreshes fail, verify the Pages workflow artifact contains the Angular browser output and the app was built with the repository `base-href`.
- If PowerShell blocks npm scripts locally, run `npm.cmd` commands.
