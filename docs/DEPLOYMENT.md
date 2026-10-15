# Deployment

## Frontend

The Vite application lives in `frontend-react/`.

- **Netlify:** `netlify.toml` sets `frontend-react` as the base, runs `npm ci && npm run build`, publishes `dist`, and rewrites client routes to `index.html`.
- **GitHub Pages:** `.github/workflows/frontend-pages.yml` builds with base `/homebudgetai-fullstack/`, copies the app entry point to `404.html` for client-route refreshes, and deploys only on pushes to `main` or a manual workflow dispatch.

Before enabling a frontend deployment, set `VITE_API_BASE_URL` in the host to the HTTPS production API base, including `/api`. GitHub Pages reads it from the repository Actions variable with that name; GitHub Pages and Netlify both stop if it is missing or invalid. Netlify and Vercel need the same variable in their project settings. Vite embeds this public value in the bundle. It must not contain credentials or private keys. Confirm the selected host's domain and SPA rewrite behavior after deployment.

## API and database

Render's existing `render.yaml` requests PostgreSQL. Set the following in the API service environment:

- `DatabaseProvider=PostgreSQL`
- `ConnectionStrings__DefaultConnection` from the managed database connection string
- `Jwt__Key` as a long random secret
- `Jwt__Issuer` and `Jwt__Audience` matching the values used to issue tokens
- `Cors__AllowedOrigins__0` to the exact HTTPS frontend origin
- `SeedDemoData=false` unless seeding has been deliberately reviewed

The application supports PostgreSQL provider selection, but its PostgreSQL schema initialization uses `EnsureCreatedAsync`, not the checked-in SQL Server migrations. `EnsureCreatedAsync` does not evolve an existing schema. Do not point a new provider at valuable data or attempt a schema migration without a verified backup and a separate compatibility plan. A successful build does not prove that hosted database credentials, schema, or network access work.

## Release checks

1. Review the migration diff and secret scan.
2. Run frontend lint, tests, and production build; run the solution build and tests.
3. Set HTTPS API URL and exact CORS origin in the frontend/API hosts.
4. Verify API startup, Swagger, and a safe authenticated database-backed request.
5. Verify landing/auth pages, nested-route refresh, asset paths, and core financial workflows on desktop and mobile.
6. Deploy only after the correct production database and environment are confirmed.

This branch is prepared for review. It has not been pushed or deployed.
