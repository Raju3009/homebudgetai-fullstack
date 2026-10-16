# React Migration Record

The supported frontend is frontend-react/, built with React, Vite, and React Router. The repository keeps the ASP.NET Core API and database providers as the source of truth for finance data.

## Delivered work

- Migrated public, authentication, portfolio, and protected finance workflows to React.
- Connected React pages to the existing API contracts instead of substituting local finance data on errors.
- Added API integration coverage and frontend tests.
- Configured the root npm shortcuts, Netlify build, and GitHub Pages workflow to use the React frontend.
- Consolidated the React UI around a reusable design system and responsive app shell.

## Verification record

- Frontend lint, tests, and production build are available through the root npm scripts.
- API integration tests use an isolated SQLite database.
- Route delivery can be checked by serving the Vite app; successful HTTP responses do not prove browser rendering or live API connectivity.
- Production database connectivity and deployment must be verified in their target environments.

## Safety boundaries

- Do not reset or recreate user databases as part of frontend changes.
- Keep real credentials and signing keys out of frontend environment variables.
- Treat deployment, GitHub pushes, and pull requests as separate actions from local implementation.