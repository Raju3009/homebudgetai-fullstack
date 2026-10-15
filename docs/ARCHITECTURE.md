# Architecture

## Application

    React SPA (frontend-react/, Vite)
      - React Router routes and protected app layout
      - Auth context and centralized Axios client
      - API modules per backend resource
      - Recharts dashboard visuals and shared design system
      - Responsive page components
                | HTTP + Bearer JWT
                v
    ASP.NET Core 8 (HomeBudgetAPI/)
      - Controllers and DTO records
      - JWT authentication, authorization, and rate limiting
      - Finance services and repositories
      - EF Core (AppDbContext)
                |
                +-- SQLite local development
                +-- SQL Server provider and existing migrations
                +-- PostgreSQL provider for hosted environments

The root package.json delegates frontend development, build, lint, and test commands to frontend-react/. Netlify and GitHub Pages build that React app. Render runs the API container with provider settings from deployment configuration.

## Frontend boundaries

- frontend-react/src/api/client.js owns the base URL, timeout, bearer header, errors, and cancellation behavior.
- frontend-react/src/api/* modules own endpoint and payload contracts.
- React context owns authentication, theme, and toast state. Financial pages reload server data after successful mutations.
- The backend remains the source of truth. The React app does not synthesize finance data after failed requests.
- Financial amounts remain numeric decimal values in JSON and use the selected currency only for display. Date-only form values are converted consistently for the API.

## Authentication

- Public routes include the landing page, portfolio, login, registration, forgot password, and reset password.
- /app/* uses a protected route based on the existing token session.
- Axios sends bearer tokens only to the configured API origin. A 401 clears auth state and returns to login; 403 remains an authorization error.
- The API returns access and refresh tokens. The frontend keeps the access token and cached user compatible with the existing local-storage session; it does not persist the unused refresh token.
- Browser storage remains readable by injected scripts. HttpOnly cookie support would require a backend authentication and CORS design change.
- Backend authorization remains authoritative.

## API and data boundaries

- React context owns cross-cutting auth/theme/toast state; finance resources use page state and reload after server mutations.
- No schema reset or migration is planned. API integration tests use a temporary SQLite database, not the ignored local user database.
- The API DTOs, endpoint contracts, and ownership rules are documented in API_INVENTORY.md.

## Deployment

- Netlify builds frontend-react/ and uses its SPA fallback.
- GitHub Pages uses a base-path-aware build and client-side fallback. Its workflow deploys from main and requires a production API URL.
- Render preserves the configured PostgreSQL environment with explicit provider selection. SQLite and PostgreSQL use EnsureCreatedAsync; SQL Server keeps its existing migrations.
- CORS uses explicit configured origins. Development defaults allow the Vite origins on port 5173; production must set the exact deployed frontend origin. Credentialed wildcard CORS is disabled.

## Security limits

- Browser-stored bearer tokens can be read by injected scripts.
- Forgot password returns a reset token in the API response and has no email delivery provider.
- The two-factor control has no backend implementation.
- PostgreSQL provider selection is implemented, but deployed connectivity and schema compatibility require environment-specific verification.