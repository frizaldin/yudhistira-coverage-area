# AI Development Context
You are developing within `new-dashboardv2`.
- **Architecture**: Laravel 11 + Inertia + React (Pragmatic Monolith).
- **Golden Rules**:
  1. NEVER use Axios for data fetching; use Inertia props.
  2. ALWAYS validate in Controllers via `$request->validate()`.
  3. ALWAYS use Spatie Middleware in Controller constructors for RBAC.
  4. ALWAYS use UI components from `@/Components/UI` (no raw HTML `<button>`, `<table>`).
  5. ALWAYS wrap pages in `<DashboardLayout>` and `<Card>`.
  6. Extract complex logic (file/API) to `app/Services/`.
- **Code Generation**: Rely on `php artisan make:full-crud` if adding new modules.
