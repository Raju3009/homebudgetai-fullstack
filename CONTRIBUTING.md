# Contributing to HomeBudgetAI

Thanks for helping improve HomeBudgetAI. Keep changes focused, production-minded, and easy to verify.

## Workflow

1. Create a feature branch from the current default branch.
2. Keep React frontend work in frontend-react/ and API work in HomeBudgetAPI/.
3. Run relevant checks before opening a pull request.
4. Include screenshots or short recordings for UI changes.
5. Document API, schema, or environment changes in README.md and .env.example.

## Frontend verification

    cd frontend-react
    npm ci
    npm run lint
    npm test
    npm run build

## Backend verification

    dotnet restore homebudgetai-fullstack.sln
    dotnet build homebudgetai-fullstack.sln -c Release
    dotnet test homebudgetai-fullstack.sln -c Release

## Design standards

- Prefer reusable UI patterns and the shared design system.
- Keep pages responsive across desktop, tablet, and mobile.
- Respect reduced-motion preferences.
- Avoid unrelated refactors in feature pull requests.