# ASP.NET API and Data Inventory

Base path: `/api`. Controllers use ASP.NET Core routing and default camel-case JSON. `Program.cs` adds `JsonStringEnumConverter`, so transaction enum values are serialized as strings.

## Endpoints

| Method | Route | Auth | Request / response |
|---|---|---|---|
| POST | `/Auth/register` | Anonymous | `{ fullName, email, password }` -> `AuthResponse` with token, refreshToken, user fields and expiry. Duplicate email returns 409; password must be at least 8 chars. |
| POST | `/Auth/login` | Anonymous | `{ email, password }` -> `AuthResponse`; invalid credentials return 401. |
| POST | `/Auth/refresh` | Anonymous | `{ refreshToken }` -> new `AuthResponse`; old token is revoked. |
| POST | `/Auth/forgot-password` | Anonymous | `{ email }` -> message; for a known account, the demo implementation also returns `resetToken` in the body. No email provider is configured. |
| POST | `/Auth/reset-password` | Anonymous | `{ email, token, newPassword }` -> message; token expires in 30 minutes. |
| GET | `/Auth/me` | Bearer | Current `ProfileResponse`. |
| GET | `/Dashboard` | Bearer | `DashboardSummary`: income, expenses, balance, savings rate, category totals, monthly totals, six recent transactions, suggestions. |
| GET | `/Transactions` | Bearer | `q`, `category`, `type`, `from`, `to`, `page`, `pageSize` -> `PagedResponse<TransactionResponse>`. Page size is clamped to 5–100. |
| POST | `/Transactions` | Bearer | `{ title, category, amount, type, date, notes }` -> created transaction; title/category required and amount > 0. |
| PUT | `/Transactions/{id}` | Bearer | Same transaction request -> updated row; only current user's row can be changed. |
| DELETE | `/Transactions/{id}` | Bearer | Current user's row -> 204; missing/foreign row -> 404. |
| GET | `/Transactions/export` | Bearer | Same filters, CSV attachment; repository call currently requests at most 100 rows. |
| GET | `/Budgets` | Bearer | Current user's budgets, with expense total for each budget's own calendar month and category. |
| POST | `/Budgets` | Bearer | `{ name, category, limitAmount, month, alertThreshold, isActive }` -> budget; amount must be > 0. |
| PUT | `/Budgets/{id}` | Bearer | Same request -> current user's updated budget. |
| DELETE | `/Budgets/{id}` | Bearer | Current user's budget -> 204. |
| GET | `/Goals` | Bearer | Current user's goals ordered by due date. |
| POST | `/Goals` | Bearer | `{ name, targetAmount, currentAmount, dueDate, color }` -> created goal. |
| PUT | `/Goals/{id}` | Bearer | Same request -> updated current user's goal. There is no delete route. |
| GET | `/Reports/summary` | Bearer | Query `period` (`monthly` or `yearly`), `month` (`YYYY-MM`), `year` -> `ReportSummary`. Other period values follow the monthly branch. |
| GET | `/Reports/export` | Bearer | Same query -> CSV attachment. |
| GET | `/Notifications` | Bearer | Current user's latest 40 `NotificationResponse` rows. Current implementation inserts sample defaults when none exist. |
| POST | `/Notifications/{id}/read` | Bearer | Marks current user's notification read -> 204. |
| GET | `/Settings` | Bearer | Current `UserSettingResponse`; creates defaults when missing. |
| PUT | `/Settings` | Bearer | `{ currency, language, theme, emailNotifications, pushNotifications, monthlyDigest }` -> saved preferences. |
| PUT | `/Profile` | Bearer | `{ fullName, avatarUrl }` -> updated `ProfileResponse`; email and role are not editable. |
| POST | `/Profile/change-password` | Bearer | `{ currentPassword, newPassword }` -> message; current password must match and new password >= 8 chars. |
| POST | `/Contact` | Anonymous | `{ name, email, message }` -> saved contact message. Current portfolio does not call it. |
| GET | `/Expense` | Bearer | Compatibility endpoint returns an empty page; not a transaction source. |
| GET | `/Health` | Anonymous | Health status and UTC timestamp; does not test database connectivity. |
| GET | `/Test` | Anonymous | Static API-working text; does not test database connectivity. |
| GET | `/User` | User/Admin roles | Static authorization check. |

## Entity model

- `User`: unique email, password hash, role, avatar URL, password-reset hash/expiry, creation time.
- `BudgetTransaction`: title/category (free text), decimal amount, `Income`/`Expense`, date, optional notes, user foreign key. EF precision is 18,2; indexes cover user/date and user/category. The enum is stored as an integer by EF and serialized as a string by the API.
- `Budget`: name, category, decimal limit, month, alert threshold, active flag, creation time, and user FK; amount precision is 18,2; index covers user/month/category.
- `FinancialGoal`: name, decimal target/current amounts, due date, color, user FK; amounts are 18,2; index covers user.
- `Category`: name/color/icon and user FK; unique by user/name, but no API controller currently exposes it.
- `Notification`: title/message/type/read/time and user FK; index covers user/read/creation time.
- `UserSetting`: currency/language/theme/notification preferences; unique user FK.
- `RefreshToken`: SHA-256 token hash, expiry/revocation times and user FK; hash is unique and user FK is indexed.
- `ContactMessage`: public contact form values and creation time; not linked to a user.
- `Expense` derives from `BudgetTransaction` but is not exposed as separate CRUD. No `DbSet<Expense>` or expense table is used by the routed controller.

`User` has one optional `UserSetting` and one-to-many transactions, categories, budgets, goals, notifications, and refresh tokens. All user-owned foreign keys cascade on user deletion. The only one-to-one relationship is `User` to `UserSetting`; public contact messages are independent.

## Migrations and schema constraints

- The checked-in SQL Server migration set contains a single `InitialCreate` migration and model snapshot. Its DDL uses SQL Server types/identity annotations (`nvarchar`, `datetime2`, `decimal(18,2)`, `bit`, integer identity).
- Unique indexes enforce user email, one setting per user, category name per user, and refresh-token hash. User-owned rows have foreign keys with cascade delete. Transaction amount and budget/goal values use `decimal(18,2)`.
- SQL Server startup applies that migration set. SQLite and PostgreSQL startup use `EnsureCreatedAsync()` and have no provider-specific migration history. `EnsureCreatedAsync()` does not evolve an existing schema.
- No migration or schema change was run against the ignored local SQLite file or a hosted database during this work.

## Database and preservation

- Provider default is SQLite with `Data Source=homebudget-local.db`; SQLite startup uses `EnsureCreatedAsync()` and development seeding.
- `DatabaseProvider` now explicitly accepts SQLite, PostgreSQL/Postgres, or SQL Server. PostgreSQL and SQLite use `EnsureCreatedAsync()`; SQL Server uses the existing SQL Server-shaped migration set.
- `render.yaml` requests PostgreSQL. Provider selection is implemented, but a live Render database connection and schema/data compatibility still require deployment-side verification.
- Existing ignored `HomeBudgetAPI/homebudget-local.db` is present locally. Keep it untouched during tests; use a separate temporary SQLite database.
- No schema changes or destructive migrations are in scope. A new provider may initialize an empty database only; production data/schema requires separate verification.

## Security and contract findings

- User-owned transaction, budget, goal, notification, profile, and settings queries scope to the authenticated user ID.
- `POST /Auth/forgot-password` exposes a reset token in its demo response for known accounts; no production email delivery exists.
- `appsettings.json` no longer contains a JWT signing value. Configure `Jwt:Key` through .NET user secrets or deployment environment settings; never copy it into React variables or examples.
- Exception middleware returns a generic 500 response with a trace ID while logging details server-side. Database initialization failures now stop startup.
- JWT lifetimes: access token 12 hours, refresh token 14 days. The React client does not call the refresh endpoint; it handles access-token expiry by clearing the session and returning to login.
- Password hashes use PBKDF2-SHA256 with 100,000 iterations. Refresh tokens are stored hashed in the database.
