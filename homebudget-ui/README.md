# Katkuri Raju Portfolio and HomeBudgetAI Frontend

This Angular application now serves as a professional developer portfolio for **Katkuri Raju** and keeps the HomeBudgetAI finance application available behind the protected app routes.

## Portfolio Overview

The default `/` route is a premium, recruiter-focused full-stack developer portfolio built with Angular standalone components. It highlights:

- Hero section with resume, GitHub, LinkedIn, and contact actions.
- About section written for fresher full-stack developer roles.
- Skills grouped by frontend, backend, database, and tools.
- Featured HomeBudgetAI project with live demo, GitHub link, tech badges, architecture highlights, and screenshot placeholders.
- Project filtering for full-stack, backend, and frontend work.
- Experience and learning journey timeline.
- Education and certification sections from the resume.
- Contact form that opens an email draft to `rajkatkuri05@gmail.com`.
- Dark/light mode toggle, glassmorphism cards, smooth animations, responsive mobile layouts, and SEO metadata.

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

- `/` - Katkuri Raju developer portfolio
- `/login` - HomeBudgetAI login
- `/register` - HomeBudgetAI registration
- `/app/dashboard` - Protected HomeBudgetAI app dashboard
- `/resume/Katkuri_Raju_Resume.pdf` - Resume download asset

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