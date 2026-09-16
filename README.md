# HomeBudgetAI

A full-stack household finance application built with Angular and ASP.NET Core Web API.

HomeBudgetAI helps users manage transactions, budgets, savings goals, reports, and financial insights through a responsive web application.

## Overview

The project combines a modern Angular frontend with a .NET 8 Web API backend and Entity Framework Core. It includes authentication, financial tracking, reporting, dashboards, and database support for local and deployed environments.

## Key Features

- User registration and login with JWT authentication
- Protected application routes
- Transaction create, edit, delete, search, filtering, sorting, pagination, and CSV export
- Budget management
- Savings goal tracking
- Financial reports and analytics
- Dashboard charts and category insights
- Notifications, profile, and settings pages
- Swagger API documentation
- Responsive UI with light/dark mode
- Docker and deployment configuration

## Architecture

```text
Angular Frontend
      |
      | HTTP / JWT
      v
ASP.NET Core Web API
      |
      v
Services / Repositories
      |
      v
Entity Framework Core
      |
      v
SQLite / SQL Server / PostgreSQL
```

## Technology Stack

### Frontend

- Angular 21
- TypeScript
- RxJS
- Tailwind CSS
- Bootstrap utilities
- Chart.js
- lucide-angular

### Backend

- C#
- .NET 8
- ASP.NET Core Web API
- Entity Framework Core
- JWT Bearer Authentication
- Swagger / OpenAPI
- Rate limiting

### Database

- SQLite for local development
- SQL Server support
- PostgreSQL deployment configuration

### Tools & Deployment

- Git & GitHub
- Docker
- Netlify
- Render
- Visual Studio / VS Code

## Project Structure

```text
homebudgetai-fullstack/
├── HomeBudgetAPI/       # ASP.NET Core Web API
├── homebudget-ui/       # Angular frontend
├── .github/             # GitHub configuration
├── homebudgetai-fullstack.sln
├── .env.example
├── .gitignore
├── netlify.toml
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js and npm
- Git
- A supported database configuration

### Backend

```bash
cd HomeBudgetAPI
dotnet restore
dotnet run
```

Swagger is available at the API's `/swagger` route when the application is running.

### Frontend

```bash
cd homebudget-ui
npm ci
npm start
```

The Angular development server normally runs at `http://localhost:4200`.

## Configuration

Use `.env.example` as the template for environment-specific configuration. Keep real secrets, JWT keys, passwords, and production connection strings out of Git.

Typical configuration includes:

- Database provider
- Database connection string
- JWT key, issuer, and audience
- Allowed CORS origins
- Demo-data configuration

## API

The backend exposes REST endpoints for authentication, transactions, budgets, goals, reports, notifications, settings, and profile management.

Use Swagger while running the API to explore the current endpoint definitions and request/response models.

## Live Links

- **Application:** https://wondrous-khapse-cc5b19.netlify.app
- **Swagger API:** https://homebudgetai-fullstack-2.onrender.com/swagger

## Screenshots

Screenshots can be added here to demonstrate the main user experience, including:

- Landing page
- Authentication
- Dashboard
- Transactions
- Budgets and goals
- Reports
- Mobile layout

## Development Notes

- Keep frontend changes inside `homebudget-ui`.
- Keep API changes inside `HomeBudgetAPI`.
- Do not commit generated folders such as `node_modules`, `dist`, `bin`, or `obj`.
- Do not commit `.env` files or real credentials.
- Run the frontend production build and .NET build before publishing significant changes.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
