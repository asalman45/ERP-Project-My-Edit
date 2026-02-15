# Empcl ERP System Overview

## Purpose
- Provide a concise, shareable summary of how the Empcl ERP platform is structured today.
- Help new developers, stakeholders, and integration partners understand available services, tech stack, and operational workflows.

## High-Level Architecture
- **Client:** `erp-frontend` (Vite + React + TypeScript + Tailwind/shadcn UI)
- **API Layer:** `erp-backend` (Node.js 18+, Express, Socket.IO, Prisma/pg)
- **Database:** PostgreSQL 14 (Dockerized, Prisma-managed schema, raw SQL migrations)
- **Supporting Services:** Docker Compose orchestration (`docker-compose.yml`, `docker-manage.ps1/.sh`), background job scripts (`erp-backend/scripts`), file-based data imports/exports.
- **Dev Tooling:** ESLint, Nodemon, React Query, Jest-like testing pending.

```
[React Frontend] ←→ [Express API] ←→ [PostgreSQL]
        ↑                    ↓              ↑
   Socket.IO client     Socket.IO server    |
        │                Background jobs    └─ Prisma + raw SQL migrations
```

## Backend Service (`erp-backend`)
- **Entry point:** `src/index.js` configures Express, middlewares (CORS, Helmet), routes, Socket.IO, and Pino logging.
- **Structure:**
  - `src/controllers/api` – REST controllers (production, MRP, inventory, etc.).
  - `src/services` – business logic (BOM calculations, procurement planning, inventory valuation).
  - `src/models` – Prisma data access helpers and raw SQL queries for performance-sensitive flows.
  - `src/routes` – Express route registrations, versioned by domain.
  - `src/validators` – Joi schemas and request validation utilities.
  - `src/utils` – shared helpers (error handling, PDF/Excel export, notification service).
- **Core dependencies:** Express, Prisma ORM (`@prisma/client`), `pg` driver, Socket.IO, Nodemailer, Puppeteer/ExcelJS for reporting, Joi for validation, Pino for logging.
- **Database access:** Mix of Prisma models and handcrafted SQL scripts (stored at backend root) executed via migration runner `migrations/run-migrations.js`.
- **Documentation:**
  - `API_DOCUMENTATION.md`, `API_DOCUMENTATION_EXTENDED.md`, `INVENTORY_API_DOCUMENTATION.md` – endpoint reference.
  - `ENHANCED_BOM_DOCUMENTATION.md`, `OTHER_PARTS_INVENTORY_FLOW.md`, `SALES_ORDER_TO_DISPATCH_WORKFLOW.md` – domain-specific process guides.

## Frontend Application (`erp-frontend`)
- **Framework:** React 18 with Vite bundler (TypeScript).
- **UI Toolkit:** shadcn UI (Radix primitives, Tailwind CSS), Lucide icons.
- **State/Data:** React Query for server state, React Hook Form + Zod for forms, TanStack Router for navigation (via `react-router-dom`).
- **Structure:**
  - `src/pages` – feature screens (BOM, Production Recipe, Dispatch, Inventory, etc.).
  - `src/components` – reusable UI primitives and domain widgets.
  - `src/services` – API clients wrapping backend endpoints.
  - `src/hooks`, `src/utils`, `src/types` – shared logic, helpers, and TypeScript models.
- **Real-time:** Socket.IO client for production updates, notifications, and inventory status.
- **Build scripts:** `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

## Data & Persistence Layer
- **Database:** PostgreSQL 14+ running in Docker (`erp-postgres` container, default port 5432 → host 5433 if using backend compose).
- **Schema Management:**
  - Primary schema defined via Prisma models (`erp-backend/prisma/schema.prisma`).
  - Complemented by raw SQL migration files in backend root for legacy tables or complex DDL.
  - Migration runner `npm run migrate` applies SQL scripts sequentially; `npm run seed` populates reference data.
- **Backup Strategy:** Use `docker exec erp-postgres pg_dump ...` (see existing `erp_database_dump_*.sql` artifacts). Consider excluding dumps from Git using `.gitignore`.

## Infrastructure & Deployment
- **Docker Compose (root `docker-compose.yml`):** Defines `erp-frontend`, `erp-backend`, `erp-postgres`, and optional support services. Environment variables sourced from `.env` files in service directories.
- **Backend Compose (`erp-backend/docker-compose.yml`):** Localized stack for API + DB testing; maps PostgreSQL to host port 5433.
- **Scripts:**
  - `docker-manage.ps1` / `.sh` – convenience wrappers to build, start, stop, and inspect services.
  - `scripts/` directory – domain-specific utilities (inventory reconciliation, report generation, data import/export).
- **Environments:**
  - Development uses local `.env` files (see `erp-backend/.env.example` if present) with Prisma connection string and SMTP/third-party keys.
  - Production deploy typically runs containers or Node processes behind a reverse proxy; ensure `NODE_ENV=production` and database credentials in place.

## Development Workflow
- **Prerequisites:** Node.js 18+, npm 9+, Docker Desktop (for containerized workflows), PostgreSQL client tools (`psql`, `pg_dump`).
- **Initial Setup:**
  1. `cd erp-backend && npm install`
  2. `cd ../erp-frontend && npm install`
  3. Copy `.env.backup` → `.env` in backend and update secrets.
  4. Run `docker compose up -d` (root) to start PostgreSQL and services, or `npm run dev` individually for hot reload.
- **Running Locally:**
  - Backend: `npm run dev` (nodemon auto-reloads), `npm run lint` for ESLint.
  - Frontend: `npm run dev` (Vite dev server on port 5173 by default).
  - Database migrations: `npm run migrate` (backend).
- **Testing & QA:** Automated tests pending; manual QA encourages use of existing API documentation and Postman collections (if available).

## Cross-Cutting Concerns
- **Authentication/Authorization:** Currently controller-level checks; consider central middleware for role-based policies.
- **Observability:** Pino logs (JSON) with optional pretty-print via `pino-pretty`; `backend.log` file captures runtime logs.
- **File Handling:** Uploads stored under `erp-backend/uploads`; reports generated as PDF/Excel via Puppeteer/ExcelJS.
- **Email & Notifications:** Nodemailer for transactional email; Socket.IO for in-app notifications.
- **Validation & Error Handling:** Joi schemas enforce payload structure; centralized error middleware returns consistent API responses.

## Existing Documentation Index
- Backend API references: `erp-backend/API_DOCUMENTATION.md`, `API_DOCUMENTATION_EXTENDED.md`, `INVENTORY_API_DOCUMENTATION.md`.
- Process guides: `ENHANCED_BOM_DOCUMENTATION.md`, `OTHER_PARTS_INVENTORY_FLOW.md`, `SALES_ORDER_TO_DISPATCH_WORKFLOW.md`.
- Migration support: `MIGRATION_CHECKLIST.md`, `MIGRATION_GUIDE.md` (root).
- Docker usage: `DOCKER_README.md` and helper scripts in project root.

## End-to-End Business Workflow
- **Sales Intake:** Customer orders entered in `erp-frontend` sales modules; backend creates sales orders, reserves inventory, and triggers credit/approval checks.
- **Material Requirements Planning (MRP):** `mrpApi` controllers explode BOMs, calculate shortages, and schedule production jobs; planned purchase orders generated for procurement.
- **Procurement & Receiving:** Purchase orders exported to suppliers; upon receipt, inventory is updated via `inventoryApi`, and quality checks log accepted/rejected quantities.
- **Production Execution:** Production recipes and work orders managed in `productionApi`; operators capture batch progress, consumption, and yield through real-time Socket.IO updates.
- **Inventory & Warehouse:** Finished goods moved to dispatch-ready locations, cycle counts reconciled, and stock valuations recalculated through services in `inventory` domain.
- **Dispatch & Logistics:** Dispatch controller orchestrates picklists, packing, and shipment confirmation; shipping documents (PDF/Excel) generated via Puppeteer/ExcelJS.
- **Finance & Billing:** Invoices issued using customer invoice tables/migrations; payment status updates flow back into sales order lifecycle for profitability tracking.
- **Reporting & Audit:** API endpoints feed dashboards and exports; audit trails stored in PostgreSQL with roll-forward migrations ensuring compliance.

## Integration Tips for External Teams
- Consume REST endpoints via documented routes (`/api/*`) with appropriate authentication headers (coordinate with backend team for token strategy).
- Use Socket.IO namespace (default) for real-time production updates; see frontend `src/services/socket` for client conventions.
- Coordinate database integrations through API layer when possible; direct DB access should respect Prisma schema and existing migrations.
- Share updated API contracts via the Markdown docs above; consider generating OpenAPI specifications in future iterations.

## Open Items / Next Steps
- Standardize environment variable templates (`.env.example` for frontend/backend).
- Automate database backups and ensure Git ignores dump artifacts.
- Expand automated test coverage (unit + integration) to improve confidence.
- Consider adding CI/CD pipeline documentation (GitHub Actions/Azure DevOps) once finalized.
