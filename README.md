# AI Expense & Business Analytics SaaS

Production-grade, secure, multi-tenant AI Expense & Business Analytics SaaS platform. Built with a modern microservice-oriented architecture separating core business API logic, high-performance analytics/AI processing, and rich interactive frontend experience.

---

## 🏗️ System Architecture

```
[ React.js Frontend (Vite) ] ── (Bearer Token API Requests) ──┐
                                                             ▼
[ Laravel REST API Backend (PHP 8+) ] ──► [ PostgreSQL 15/16 Database ]
           │
           ▼
[ FastAPI Analytics Service (Python) ] ──► [ Pandas / NumPy / AI Engine ]
```

### Microservices & Component Responsibilities

1. **`backend/` (Laravel REST API Backend)**
   - **Role**: Primary application backend & source of truth.
   - **Responsibilities**: Authentication (Sanctum), Role Authorization (RBAC), Request Validation (Form Requests), Business Logic, PostgreSQL Database Migrations/Seeders, CORS enforcement, Security Scoping, Audit Logging, and Notification Dispatch.
   - **Database**: Communicates directly with PostgreSQL. Never exposes raw database credentials or internal stack traces.

2. **`analytics-service/` (FastAPI Microservice)**
   - **Role**: High-performance statistical & financial analytical engine.
   - **Responsibilities**: Complex numeric processing (Pandas / NumPy), financial trend forecasting, anomaly detection, spending distribution aggregation, and context assembly for AI insight generation.
   - **Rule**: AI engine receives verified, deterministic calculations from Pandas/NumPy. AI never guesses or invents financial figures.

3. **`frontend/` (React.js + Vite Frontend)**
   - **Role**: Premium User Interface & Interactive Dashboard.
   - **Responsibilities**: Modern SaaS UI/UX, responsive layouts, data visualization, real-time feedback, loading states, empty states, and client-side routing.
   - **Rule**: React frontend strictly interacts with the Laravel REST API; it **never** communicates directly with PostgreSQL.

---

## 🔒 Authentication & Authorization Architecture (PHASE 2)

### Authentication Mechanism: Laravel Sanctum
- **Token-Based Authentication**: Implemented using official **Laravel Sanctum** token-based authentication (`HasApiTokens`).
- **Token Security**: Tokens are generated using cryptographically strong random hashes and stored securely in the PostgreSQL `personal_access_tokens` table.
- **Client Storage**: React frontend securely manages tokens via `localStorage` and automatically attaches `Authorization: Bearer <token>` on all outgoing Axios requests.
- **Session Revocation**: Password changes automatically revoke all existing active tokens for the user and issue a fresh session token.

### Role-Based Access Control (RBAC)
- **Supported Roles**: `user` (default) and `admin`.
- **Middleware Protection**: Protected endpoints enforce authentication via `auth:sanctum`. Admin endpoints enforce role checking via `EnsureAdminRole` middleware.
- **Controlled Error Outputs**: Unauthenticated requests return `401 Unauthenticated`. Unauthorized non-admin users attempting to access admin endpoints receive `403 Forbidden`.

### User Ownership & Financial Data Security Rule
In this application:
- **User Record Isolation**: User A can access **only** User A's records (`WHERE user_id = auth()->id()`). User B can access **only** User B's records.
- **No Insecure Direct Object References (IDOR)**: Passing a foreign ID in a request parameter is never sufficient to grant access. Backend authorization middleware and Eloquent owner scoping validate user identity on every request.

---

## 🔑 API Endpoints Reference (Version 1)

### Public & Health Endpoints
| Method | Endpoint | Description | Auth Required | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | API & PostgreSQL health check | No | None |
| `POST` | `/api/v1/auth/register` | Register new user account | No | 10 req/min |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue Bearer token | No | 10 req/min |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset link | No | 6 req/min |
| `POST` | `/api/v1/auth/reset-password` | Complete password reset using token | No | 6 req/min |

### Protected User & Profile Endpoints
| Method | Endpoint | Description | Auth Required | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/logout` | Revoke current access token | Yes (`auth:sanctum`) | None |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user details | Yes (`auth:sanctum`) | None |
| `GET` | `/api/v1/profile` | Retrieve user profile | Yes (`auth:sanctum`) | None |
| `PUT/PATCH` | `/api/v1/profile` | Update name and email | Yes (`auth:sanctum`) | None |
| `POST` | `/api/v1/profile/change-password` | Verify current & set new password | Yes (`auth:sanctum`) | None |

### Protected Financial & Category Endpoints (PHASE 3)
| Method | Endpoint | Description | Query Filters / Body | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | List user custom & system categories | `?type=expense` or `?type=income` | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/categories` | Create new custom category | `name`, `type` (`income`/`expense`) | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/categories/{id}` | View category details | | Yes (`auth:sanctum`) |
| `PATCH` | `/api/v1/categories/{id}` | Update custom category | `name`, `type` | Yes (`auth:sanctum`) |
| `DELETE` | `/api/v1/categories/{id}` | Delete custom category | Checks attached financial records | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/expenses` | Search, filter & list user expenses | `search`, `category_id`, `payment_method`, `from_date`, `to_date`, `min_amount`, `max_amount`, `sort_by`, `sort_order`, `page` | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/expenses` | Add new expense record | `amount`, `expense_date`, `category_id`, `payment_method`, `description`, `notes` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/expenses/{id}` | View expense details | | Yes (`auth:sanctum`) |
| `PATCH` | `/api/v1/expenses/{id}` | Update expense record | Partial payload | Yes (`auth:sanctum`) |
| `DELETE` | `/api/v1/expenses/{id}` | Soft delete expense record | | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/income` | Search, filter & list user income | `search`, `type`, `category_id`, `from_date`, `to_date`, `min_amount`, `max_amount`, `sort_by`, `sort_order`, `page` | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/income` | Add new income record | `amount`, `source`, `income_date`, `type`, `category_id`, `description` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/income/{id}` | View income details | | Yes (`auth:sanctum`) |
| `PATCH` | `/api/v1/income/{id}` | Update income record | Partial payload | Yes (`auth:sanctum`) |
| `DELETE` | `/api/v1/income/{id}` | Soft delete income record | | Yes (`auth:sanctum`) |

### Protected Financial Dashboard Endpoint (PHASE 4)
| Method | Endpoint | Description | Query Parameters | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard` | Aggregated financial summary, comparisons, monthly trends, breakdowns & recent transactions | `period` (`current_month`, `previous_month`, `last_7_days`, `last_30_days`, `last_90_days`, `current_year`, `custom`), `from_date`, `to_date` | Yes (`auth:sanctum`) |

### Protected Budget & Financial Goal Endpoints (PHASE 5)
| Method | Endpoint | Description | Body / Query Parameters | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/budgets` | List user budgets with spending calculations | `period` (`active`/`upcoming`/`past`), `category_id`, `search`, `page` | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/budgets` | Create new budget | `name`, `amount`, `start_date`, `end_date`, `alert_threshold`, `category_id` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/budgets/{id}` | View budget details & spending status | | Yes (`auth:sanctum`) |
| `PATCH` | `/api/v1/budgets/{id}` | Update budget | Partial budget payload | Yes (`auth:sanctum`) |
| `DELETE` | `/api/v1/budgets/{id}` | Delete budget | | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/goals` | List user financial goals with progress | `status` (`active`/`completed`/`overdue`), `search`, `page` | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/goals` | Create new financial goal | `name`, `target_amount`, `target_date`, `description` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/goals/{id}` | View goal details & contribution history | | Yes (`auth:sanctum`) |
| `PATCH` | `/api/v1/goals/{id}` | Update financial goal | Partial goal payload | Yes (`auth:sanctum`) |
| `DELETE` | `/api/v1/goals/{id}` | Delete financial goal & contributions | | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/goals/{goalId}/contributions` | List deposit contributions for a goal | | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/goals/{goalId}/contributions` | Add deposit contribution to a goal | `amount`, `contribution_date`, `notes` | Yes (`auth:sanctum`) |
| `PATCH` | `/api/v1/goals/{goalId}/contributions/{id}` | Update deposit contribution | `amount`, `contribution_date`, `notes` | Yes (`auth:sanctum`) |
| `DELETE` | `/api/v1/goals/{goalId}/contributions/{id}` | Delete deposit contribution | Synchronizes goal `current_amount` | Yes (`auth:sanctum`) |

### Python Analytics Engine Endpoints (PHASE 6 & PHASE 7)
| Method | Endpoint | Description | Query Parameters | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/full` | Complete Phase 6 Pandas & NumPy analytics suite | `period`, `from_date`, `to_date` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/analytics/advanced-summary` | Phase 7 full analytics suite (summary, comparison, IQR anomalies, patterns, budgets, goals) | `period`, `from_date`, `to_date` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/analytics/comparison` | Period-over-period financial comparison | `period`, `from_date`, `to_date` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/analytics/spending-patterns` | Day-of-week spending distribution & transaction metrics | `period`, `from_date`, `to_date` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/analytics/anomalies` | Statistical outlier detection using IQR rule ($Q3 + 1.5 \times \text{IQR}$) | `period`, `from_date`, `to_date` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/analytics/budget-performance` | Budget utilization and limit status breakdown | | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/analytics/goal-performance` | Financial goal completion & deposit metrics | | Yes (`auth:sanctum`) |

### AI Financial Assistant Endpoints (PHASE 8)
| Method | Endpoint | Description | Body / Query Parameters | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/chat` | Send natural language query to AI Financial Assistant | `message`, `conversation_id` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/ai/conversations` | List user AI conversations | | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/ai/conversations` | Create new AI conversation session | `title` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/ai/conversations/{id}` | Get conversation session with message history | | Yes (`auth:sanctum`) |
| `DELETE` | `/api/v1/ai/conversations/{id}` | Delete conversation session & messages | | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/ai/insights` | List stored AI executive insights | | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/ai/insights/generate` | Generate on-demand AI executive summary | `insight_type` | Yes (`auth:sanctum`) |

### Report Center & Financial Export Endpoints (PHASE 9)
| Method | Endpoint | Description | Body / Query Parameters | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/types` | List supported report types & descriptions | | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/reports/preview` | Preview report data before export | `report_type`, `period`, `from_date`, `to_date`, `category_id`, `payment_method`, etc. | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/reports/export/csv` | Stream CSV file download with formula injection protection | Same as preview | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/reports/export/pdf` | Generate & download A4 PDF financial report | Same as preview | Yes (`auth:sanctum`) |

### Protected User Notification Endpoints (PHASE 10)
| Method | Endpoint | Description | Body / Query Parameters | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | List user notifications with filtering & pagination | `unread_only`, `read_only`, `type`, `priority`, `page`, `per_page` | Yes (`auth:sanctum`) |
| `GET` | `/api/v1/notifications/unread-count` | Retrieve current count of unread user notifications | | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/notifications/mark-read` | Mark array of notification IDs as read | `ids` (Array of Notification IDs) | Yes (`auth:sanctum`) |
| `POST` | `/api/v1/notifications/mark-all-read` | Mark all unread notifications as read for current user | | Yes (`auth:sanctum`) |
| `DELETE` | `/api/v1/notifications/{id}` | Delete notification record | | Yes (`auth:sanctum`) |

### Admin Panel & System Control Endpoints (PHASE 10)
| Method | Endpoint | Description | Body / Query Parameters | Auth Required | Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Admin dashboard metrics, user counts & audit previews | | Yes (`auth:sanctum`) | `admin` |
| `GET` | `/api/v1/admin/users` | List & filter system users with pagination | `search`, `role`, `status`, `page`, `per_page` | Yes (`auth:sanctum`) | `admin` |
| `GET` | `/api/v1/admin/users/{id}` | View detailed user account info | | Yes (`auth:sanctum`) | `admin` |
| `PATCH` | `/api/v1/admin/users/{id}/role` | Update user role (`user`<->`admin`). Enforces Last-Admin Guard. | `role` (`user`/`admin`) | Yes (`auth:sanctum`) | `admin` |
| `PATCH` | `/api/v1/admin/users/{id}/status` | Update user status (`active`<->`inactive`). Enforces Last-Admin Guard. | `status` (`active`/`inactive`) | Yes (`auth:sanctum`) | `admin` |
| `GET` | `/api/v1/admin/audit-logs` | Filter & inspect system-wide audit logs | `action`, `user_id`, `search`, `page` | Yes (`auth:sanctum`) | `admin` |
| `GET` | `/api/v1/admin/notifications` | Monitor all dispatched system notifications | `type`, `priority`, `page` | Yes (`auth:sanctum`) | `admin` |
| `GET` | `/api/v1/admin/system-health` | Probing health check for Laravel, PostgreSQL & FastAPI | | Yes (`auth:sanctum`) | `admin` |
| `GET` | `/api/v1/admin/test` | Admin authorization test endpoint | | Yes (`auth:sanctum`) | `admin` |

---

## 📋 API Response Standard

### Standardized Success Response (`HTTP 200 / 201`)
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Demo Administrator",
      "email": "admin@example.com",
      "role": "admin",
      "created_at": "2026-10-03T06:34:04+00:00",
      "updated_at": "2026-10-03T06:34:04+00:00"
    },
    "token": "6|kkskehy2umk9vrNmPuugAQSmB0j4AwrKkvELqpMa9705241c",
    "token_type": "Bearer"
  }
}
```

### Standardized Error Response (`HTTP 401 / 403 / 422 / 429`)
```json
{
  "success": false,
  "message": "Invalid credentials",
  "errors": {
    "email": ["The provided credentials do not match our records."]
  }
}
```

---

## 🗄️ Database Schema Overview

| Entity | Description | Core Attributes |
| :--- | :--- | :--- |
| `users` | User accounts & roles | `id`, `name`, `email`, `password`, `role` (`user`, `admin`) |
| `personal_access_tokens` | Sanctum Bearer tokens | `id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at` |
| `categories` | System & Custom Categories | `id`, `user_id` (NULL = System category), `name`, `type` (`income`/`expense`) |
| `expenses` | Expense records | `id`, `user_id`, `category_id`, `amount` (Decimal), `expense_date`, `payment_method`, `notes`, `deleted_at` |
| `income` | Income records | `id`, `user_id`, `category_id`, `amount` (Decimal), `source`, `income_date`, `type`, `deleted_at` |
| `budgets` | Category & overall spending limits | `id`, `user_id`, `category_id`, `name`, `amount`, `start_date`, `end_date`, `alert_threshold` |
| `financial_goals` | Savings & purchase targets | `id`, `user_id`, `name`, `target_amount`, `current_amount`, `target_date`, `description` |
| `goal_contributions` | Contributions to goals | `id`, `financial_goal_id`, `amount`, `contribution_date`, `notes` |
| `notifications` | System & alert notifications | `id`, `user_id`, `title`, `message`, `type`, `is_read` |
| `ai_insights` | Verified AI insights & trends | `id`, `user_id`, `insight_type`, `title`, `content`, `metadata` (JSONB) |
| `receipts` | Expense receipt metadata | `id`, `user_id`, `expense_id`, `file_name`, `file_path`, `mime_type`, `file_size` |
| `audit_logs` | Security & activity log | `id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata` (JSONB), `ip_address` |

---

## 📝 Audit Log Integration

All critical security and account lifecycle actions record an audit log entry in the PostgreSQL `audit_logs` table:
- `user_registered`: Recorded upon successful account creation.
- `user_logged_in`: Recorded upon successful login.
- `user_logged_out`: Recorded upon session termination.
- `login_failed`: Recorded upon failed credential validation (storing non-sensitive email attempt & IP address).
- `profile_updated`: Recorded upon profile name/email updates.
- `password_changed`: Recorded upon password modification.
- `password_reset_requested`: Recorded upon password reset link generation.

---

## 🛡️ Security Hardening & Performance Optimizations (PHASE 11)

### 1. HTTP Security Headers Middleware
All backend API responses enforce strict security headers:
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing attacks.
- `X-Frame-Options: DENY`: Protects application against clickjacking in frames.
- `X-XSS-Protection: 1; mode=block`: Enables cross-site scripting filtering.
- `Referrer-Policy: strict-origin-when-cross-origin`: Controls referrer leakage.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: Restricts sensitive browser features.

### 2. Frontend Performance & Bundle Optimization
- **Route-Based Code Splitting**: Applied `React.lazy()` and `<Suspense fallback={<PageLoader />}>` across feature modules and admin views. Reduced primary initial JavaScript bundle size from **942.58 kB down to 692.98 kB** (-26.5% reduction).
- **React Error Boundary**: Implemented `<ErrorBoundary>` component around root routing to gracefully handle unhandled rendering errors without blank screen failures.
- **Light/Dark Mode Theme Engine**: Built `<ThemeProvider>` context and `<ThemeToggle />` component with dark mode DOM class toggling and `localStorage` persistence.

### 3. AI Security & Prompt Injection Defense
- **System Prompt Rules**: Enforced strict rules prohibiting disclosure of system prompts, developer tools, database schemas, API keys, or service tokens.
- **Response Sanitization**: `AIResponseValidator` automatically scrubs API key patterns (`AIzaSy...`, `sk-proj-...`, `secret-analytics-internal-token...`) from AI outputs.

### 4. Admin Security Guards
- **Last-Admin Protection**: `updateRole()` and `updateStatus()` check active admin accounts count before allowing updates. Prevents accidental deactivation or demotion of the final administrator with HTTP `422 Unprocessable Entity`.
- **Inactive Account Blocking**: `AuthController` blocks login attempts for deactivated users (`$user->status === 'inactive'`).

---

## 🚀 Development Setup & Running Commands

### 1. PostgreSQL Database Server
Ensure PostgreSQL 15/16 is running on port `5432`:
```powershell
C:\Users\komal\pgsql\pgsql\bin\postgres.exe -D "C:\Users\komal\pgsql\data"
```

### 2. Backend Laravel API
```powershell
cd backend
php artisan migrate:fresh --seed
php artisan serve --port=8000
```
- **Local API Base URL**: `http://localhost:8000/api/v1`
- **Seeded Development Accounts**:
  - **Demo Admin**: `admin@example.com` / `AdminPassword123!`
  - **Demo User**: `user@example.com` / `UserPassword123!`

### 3. FastAPI Analytics Service
```powershell
cd analytics-service
python -m uvicorn app.main:app --port 8001 --reload
```
- **Service Base URL**: `http://localhost:8001`

### 4. React Frontend Web App
```powershell
cd frontend
npm install
npm run dev
```
- **Web App URL**: `http://localhost:5173`

---

## ☁️ Render Production Deployment Guide & Runbook (PHASE 12)

The application includes an automated `render.yaml` Blueprint for multi-service cloud deployment on Render.

### Render Blueprint Architecture
```
  [ Render PostgreSQL Database (ai-expense-db) ]
                       ▲
     ┌─────────────────┴─────────────────┐
     │                                   │
[ Render Laravel Web Service ]     [ Render FastAPI Web Service ]
(ai-expense-backend)               (ai-expense-analytics)
     ▲                                   ▲
     │ (HTTPS API Calls)                 │ (Internal Token Calls)
     └──────────┐                        │
                │                        │
  [ Render Static Site (React Frontend) ]
  (ai-expense-frontend)
```

### 1. Environment Variable Configuration Checklist

#### A. Backend Service (`ai-expense-backend`)
- `APP_ENV` = `production`
- `APP_DEBUG` = `false`
- `APP_KEY` = Generated base64 key (`php artisan key:generate --show`)
- `APP_URL` = `https://ai-expense-backend.onrender.com`
- `FRONTEND_URL` = `https://ai-expense-frontend.onrender.com`
- `DB_CONNECTION` = `pgsql`
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` (Automatically populated from Render PostgreSQL)
- `ANALYTICS_SERVICE_URL` = `https://ai-expense-analytics.onrender.com`
- `ANALYTICS_SERVICE_TOKEN` = Internal secret token (matching FastAPI)
- `AI_PROVIDER` = `gemini` or `openai`
- `GEMINI_API_KEY` = Secret Gemini API key

#### B. FastAPI Analytics Service (`ai-expense-analytics`)
- `APP_ENV` = `production`
- `DATABASE_URL` = Managed PostgreSQL connection string
- `ANALYTICS_SERVICE_TOKEN` = Internal secret token (matching Laravel)

#### C. React Frontend Static Site (`ai-expense-frontend`)
- `VITE_API_BASE_URL` = `https://ai-expense-backend.onrender.com/api/v1`
- `VITE_APP_NAME` = `"AI Expense & Business Analytics"`

---

## 🛠️ Production Runbook & Deployment Commands

### Database Migrations on Production
```bash
# Safe, non-destructive migration execution on Render production PostgreSQL
php artisan migrate --force
```

### Production Optimization Commands
```bash
# Optimize Laravel routes, configuration, and views
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend Production Build
```bash
cd frontend
npm install
npm run build
```

---

## 📜 License
This project is licensed under the MIT License.
