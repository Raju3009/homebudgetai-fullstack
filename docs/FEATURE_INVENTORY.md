# Frontend Feature Inventory

This inventory describes the supported React frontend in frontend-react/. Implemented means the React workflow exists; verification notes distinguish automated coverage and route delivery from full browser interaction.

| Route / feature | React behavior | Verification |
|---|---|---|
| / landing | Product overview and links to registration/login. | Route smoke returned HTTP 200; visual browser check was unavailable |
| /portfolio | Portfolio content, local profile/resume assets, theme behavior, and contact email action. | Route and assets returned HTTP 200; interactions not browser-tested |
| /login | API-backed authentication, password visibility, session handling, and protected-route redirect. | Frontend auth tests and API auth integration checks |
| /register | Registration through the existing auth API. | API registration integration checks; full browser flow not tested |
| /forgot-password, /reset-password | API password-reset request and token-based reset form. Email delivery is not configured. | API reset checks; full browser flow not tested |
| /app/dashboard | API-backed balance, income/expense summaries, charts, suggestions, and recent transactions. | Dashboard API and route smoke checks; chart rendering not browser-tested |
| /app/transactions | Transaction CRUD, search, filters, sorting, pagination, and CSV export. | API CRUD/filter/export checks; full browser workflow not tested |
| /app/expenses | Expense-filtered transaction workspace using the existing transaction API. | Route and shared transaction API checks |
| /app/budgets | Budget CRUD and savings-goal create/read/update with progress. No goal-delete endpoint exists. | Budget and goal API checks; full browser workflow not tested |
| /app/reports | Monthly/yearly summaries, categories, and CSV/PDF exports. | Report API checks; PDF client export not browser-tested |
| /app/activity | Notification list/grouping and mark-read behavior. | Notification API integration check |
| /app/profile | Profile read/update and password change; excludes static sample activity. | Profile/password API integration check |
| /app/settings | Supported profile/preferences and password controls. | Settings API integration check |
| App shell | Protected navigation, theme/currency preferences, responsive sidebar/mobile navigation, and logout. | Protected-route paths returned the SPA shell; responsive appearance not screenshot-verified |
| Toasts | Success/error/warning/info messages with dismissal. | Used by page/auth flows; toast interactions not separately tested |

## Shared API and data behavior

- Authentication uses the API access token and the existing local-storage session.
- Backend enum JSON values are Income and Expense.
- Financial amounts remain decimal values in transport and are formatted only for display.
- Date form values represent local calendar dates and are converted consistently for the API.
- Categories are free-text transaction values; the database has no category controller.
- The compatibility ExpenseController returns an empty page. Expense data uses the filtered Transactions endpoint.

## Known feature limits

- Two-factor authentication has no backend endpoint.
- Budget period buttons do not filter data.
- Report recommendation copy and profile activity are not API data.
- Registration does not persist monthly goal, currency, or notification preferences through the registration endpoint.
- Savings goals have list/create/update API support and no delete endpoint.