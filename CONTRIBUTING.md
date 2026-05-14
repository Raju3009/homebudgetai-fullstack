# Contributing to HomeBudgetAI

Thanks for helping improve HomeBudgetAI. Keep changes focused, production-minded, and easy to verify.

## Workflow

1. Create a feature branch from `main`.
2. Keep Angular work in `homebudget-ui` and API work in `HomeBudgetAPI`.
3. Run the relevant verification commands before opening a PR.
4. Include screenshots or short screen recordings for UI changes.
5. Document API, schema, or environment changes in `README.md` and `.env.example`.

## Verification

```powershell
cd homebudget-ui
npm ci
npm run build -- --configuration production
```

```powershell
dotnet restore HomeBudgetAPI/HomeBudgetAPI.csproj
dotnet build HomeBudgetAPI/HomeBudgetAPI.csproj -c Release --no-restore
```

## Design Standards

- Prefer reusable UI patterns and the shared design system.
- Keep pages responsive across desktop, tablet, and mobile.
- Respect reduced-motion preferences.
- Avoid unrelated refactors in feature PRs.
