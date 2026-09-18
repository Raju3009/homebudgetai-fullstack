# HomeBudgetAI Frontend

This Angular application serves the HomeBudgetAI personal finance product. The default `/` route loads the product landing page, while the developer portfolio remains available under `/portfolio` if needed for project showcases.

## HomeBudgetAI Overview

The default `/` route is the HomeBudgetAI marketing and product landing experience. It highlights:

- Premium fintech-style landing page for a personal finance command center.
- Budget, spending, analytics, and AI finance messaging.
- Secure login and registration entry points for the authenticated app.
- Protected app routes for dashboard, transactions, budgets, reports, activity, settings, and profile.
- Responsive UI, dark mode support, and production-ready SaaS styling.

## Main Project Featured

**HomeBudgetAI - Full Stack Finance Management Platform**

Tech stack:

- ASP.NET Core Web API
- Angular
- SQL Server
- Entity Framework Core
- JWT Authentication
- Swagger
- C#
- TypeScript
- HTML, CSS, Bootstrap
- GitHub, REST APIs

Highlighted features:

- User authentication and JWT authorization
- Expense management and income tracking
- Dashboard analytics
- SQL database operations
- Repository pattern and service layer architecture
- Middleware exception handling
- Rate limiting
- Responsive UI
- Cloud deployment-ready architecture

## Important Routes

- `/` - HomeBudgetAI landing page
- `/portfolio` - Developer portfolio (preserved for reference)
- `/login` - HomeBudgetAI login
- `/register` - HomeBudgetAI registration
- `/app/dashboard` - Protected HomeBudgetAI app dashboard

## Local Development

```powershell
cd D:\project\homebudgetai-fullstack\homebudget-ui
npm install
npm start
```

Open `http://localhost:4200/`.

## Production Build

```powershell
cd D:\project\homebudgetai-fullstack\homebudget-ui
npm run build -- --configuration production
```

Build output is generated in:

```text
dist/homebudget-ui
```

## Deployment

### Netlify

This repository already includes `netlify.toml` from the root project. The frontend build should use:

```toml
[build]
  base = "homebudget-ui"
  command = "npm ci && npm run build -- --configuration production"
  publish = "dist/homebudget-ui/browser"
```

### GitHub Pages or Static Hosting

Run the production build and upload the generated browser output folder from:

```text
homebudget-ui/dist/homebudget-ui/browser
```

For Angular client-side routing, configure fallback redirects to `index.html`.

## Resume Asset

The resume PDF is copied into:

```text
public/resume/Katkuri_Raju_Resume.pdf
```

The portfolio download button points to this file.

## Quality Checks

Before deployment, run:

```powershell
npm run build -- --configuration production
```

Recommended optional checks:

```powershell
npm test
```

## Contact

- Email: `rajkatkuri05@gmail.com`
- GitHub: `https://github.com/Raju3009`
- LinkedIn: `https://www.linkedin.com/in/katkuri-raju0930`