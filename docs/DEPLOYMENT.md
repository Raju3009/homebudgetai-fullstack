# Deployment

## Frontend

The Vite application lives in `frontend-react/`.

## Verified deployment endpoints

- **Production API:** `https://homebudgetai-fullstack-2.onrender.com/api` (Render health endpoint verified at `/api/health`).
- **React frontend origins currently served:** `https://wondrous-khapse-cc5b19.netlify.app` and `https://raju3009.github.io` (the GitHub Pages app path is `/homebudgetai-fullstack/`).
- **Vercel:** `vercel.json` builds the React app. A live check on 2026-10-15 found `https://homebudgetai-fullstack.vercel.app` serving a React document and bundles, but the bundle did not expose the intended Render API URL. Its usable API configuration is unverified, so the origin is not in the API CORS allowlist.

- **Netlify:** `netlify.toml` sets `frontend-react` as the base, runs `npm ci && npm run build`, publishes `dist`, and rewrites client routes to `index.html`.
- **GitHub Pages:** `.github/workflows/frontend-pages.yml` builds with base `/homebudgetai-fullstack/`, copies the app entry point to `404.html` for client-route refreshes, and deploys only on pushes to `main` or a manual workflow dispatch.
- **Vercel:** `vercel.json` installs from the React lockfile, validates the production API URL, builds `frontend-react/`, publishes its `dist/`, and rewrites client routes. Set the Vercel project Root Directory to the repository root (`.`) so this config is used.

Set `VITE_API_BASE_URL` to exactly `https://homebudgetai-fullstack-2.onrender.com/api` in each selected frontend host. Netlify gets this public value from `netlify.toml`. GitHub Pages reads the repository Actions variable `VITE_API_BASE_URL`; configure that variable in the repository settings. If React is enabled on Vercel later, configure the same project environment variable there. The production build guard rejects a missing or different API URL. Vite embeds this public value in the bundle; it must not contain credentials or private keys.

Render's `Cors__AllowedOrigins__0` and `Cors__AllowedOrigins__1` are the exact Netlify and GitHub Pages origins listed above. CORS allows only GET, POST, PUT, and DELETE, with Accept, Authorization, and Content-Type headers. The app sends JWTs in the Authorization header and does not use cookie credentials. Vercel must only be added after its React deployment is verified; do not use wildcard origins.

### Live deployment status checked on 2026-10-15

- Render `/api/health` responds with HTTP 200. An OPTIONS request from each configured frontend origin for `POST` with `Authorization, Content-Type` returned HTTP 204 but omitted `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers`. The CORS repair in this branch has not been deployed to Render.
- The live Netlify and GitHub Pages React bundles currently contain `http://localhost:5033/api`. They need new builds from this branch before browser API calls can use Render. The production build guard rejects a missing or incorrect API URL.
- The Vercel alias serves React assets, but its API target has not been verified. It is not part of the React origin allowlist; add it only after configuring and verifying the deployment.
- Recheck the actual deployed frontend bundles and API response headers after the host settings are applied and deployments complete. A successful health response alone does not verify browser CORS.

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

This feature branch is pushed for review. The React-only cleanup does not deploy to production; host deployments remain separate actions.
