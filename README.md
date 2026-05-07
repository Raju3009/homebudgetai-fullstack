# HomeBudgetAI Full Stack

AI-powered home budget management system with Angular, ASP.NET Core Web API, JWT authentication, EF Core, SQL Server/PostgreSQL support, responsive dashboards, transaction management, and cloud deployment configuration.

## Features

- JWT login, registration, forgot/reset password demo flow, role claims, protected routes, and session persistence.
- Financial dashboard with income, expenses, remaining balance, monthly Chart.js analytics, category summaries, and AI-style budget suggestions.
- Income and expense CRUD with search, category/type filters, pagination, CSV export, and responsive table layout.
- Profile update, avatar URL, and change password using PBKDF2 password hashing.
- Angular lazy routes, auth guard, HTTP interceptor, reactive forms, Tailwind, Bootstrap, Chart.js, dark/light mode, and mobile-first layout.
- ASP.NET Core clean layering with DTOs, repository pattern, dependency injection, middleware exception handling, Swagger, CORS, async EF Core APIs, and seed data.
- Deployment files for Netlify frontend and Render backend, with PostgreSQL cloud database support.

## Tech Stack

Frontend: Angular 21, Tailwind CSS, Bootstrap 5, Angular CDK/Material package, RxJS, Chart.js, reactive forms.

Backend: ASP.NET Core Web API (.NET 8), EF Core, SQL Server, PostgreSQL via Npgsql, JWT bearer auth, Swagger/OpenAPI.

Database: SQL Server LocalDB for local development; Neon, Supabase, Railway, Render PostgreSQL, or Azure PostgreSQL for production.

## Project Structure

```text
HomeBudgetAPI/       ASP.NET Core API
homebudget-ui/       Angular frontend
netlify.toml         Netlify deployment config
render.yaml          Render backend deployment blueprint
.env.example         Production environment variable template
```

## Local Setup

Prerequisites:

- Node.js 20+ and npm
- .NET 8 SDK
- SQL Server LocalDB, SQL Server, or a PostgreSQL connection string

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

Demo login:

```text
demo@homebudget.ai
Demo@12345
```

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
```

Frontend production API URL is in `homebudget-ui/src/environments/environment.prod.ts`:

```ts
apiUrl: 'https://homebudgetai-api.onrender.com/api'
```

Update it to your deployed backend URL before deploying the final frontend.

## Production Builds

```bash
cd HomeBudgetAPI
dotnet build -c Release

cd ../homebudget-ui
npm run build -- --configuration production
```

Angular output: `homebudget-ui/dist/homebudget-ui/browser`.

## Deployment Guide

### Backend on Render

1. Create a PostgreSQL database on Render, Neon, Supabase, or Railway.
2. Push this repository to GitHub.
3. In Render, create a Blueprint from `render.yaml` or create a Web Service manually with root directory `HomeBudgetAPI`.
4. Set the backend environment variables listed above.
5. Deploy and confirm `/api/health` returns healthy JSON.

The API creates the schema and seed user on first startup with `EnsureCreated`.

### Frontend on Netlify

1. Create a Netlify site from the GitHub repository.
2. Netlify reads `netlify.toml` automatically.
3. Build command: `npm ci && npm run build -- --configuration production`.
4. Publish directory: `homebudget-ui/dist/homebudget-ui/browser`.
5. Set `environment.prod.ts` to the live backend API URL before final deploy.

Angular routing is supported by `homebudget-ui/public/_redirects` and `netlify.toml`.

## API Documentation

Swagger is available at:

```text
/api/swagger
/swagger
```

Key endpoints:

- `POST /api/Auth/register`
- `POST /api/Auth/login`
- `POST /api/Auth/forgot-password`
- `POST /api/Auth/reset-password`
- `GET /api/Auth/me`
- `GET /api/Dashboard`
- `GET /api/Transactions`
- `POST /api/Transactions`
- `PUT /api/Transactions/{id}`
- `DELETE /api/Transactions/{id}`
- `GET /api/Transactions/export`
- `PUT /api/Profile`
- `POST /api/Profile/change-password`
- `GET /api/Health`

## Troubleshooting

- If Angular cannot call the API, verify `environment.ts` or `environment.prod.ts` and backend CORS origins.
- If production auth fails, ensure `Jwt__Key`, `Jwt__Issuer`, and `Jwt__Audience` match backend settings.
- If database startup fails, verify `DatabaseProvider` is `PostgreSQL` for Npgsql or `SqlServer` for SQL Server and that the connection string is reachable.
- If PowerShell blocks npm, use `npm.cmd` instead of `npm`.

## Verification Completed

- Angular production build passes.
- ASP.NET Core Release build passes.
- Deployment configs generated for Netlify and Render.
