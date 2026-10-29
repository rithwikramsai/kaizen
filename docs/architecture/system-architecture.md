# KIET — System Architecture
## Phase 0 · Architecture Foundation

**Document version:** 1.0  
**Branch:** `feature/architecture-foundation`  
**BRD reference:** Sections 3, 6, 14  
**Status:** Authoritative — monorepo structure, dev environment, and deployment model derive from this document

---

## 1. Architecture Principles

1. **Local-first development** — no cloud infrastructure assumptions. Docker + PostgreSQL + local filesystem.
2. **No Kubernetes, no Terraform, no managed cloud services** until explicitly requested.
3. **Monorepo with pnpm workspaces** — shared types enforced at compile time.
4. **Abstractions over integrations** — file storage and email are abstracted behind adapters. Swap the adapter; never touch business logic.
5. **Single workflow engine** — no workflow-per-entity proliferation. Template-driven, runtime-generated.
6. **pgvector reserved** — PostgreSQL extension installed now; AI tables created later in Phase 8.

---

## 2. High-Level System Diagram

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        KIET PLATFORM — LOCAL DEV ENVIRONMENT                ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  ┌────────────────────────────────────────────────────────────────────────┐
  │                         BROWSER                                        │
  │                                                                        │
  │   React + TypeScript + Vite + React Router + TanStack Query            │
  │   React Hook Form + Zod + Tailwind CSS                                 │
  │                                                                        │
  │   Runs on: http://localhost:5173                                        │
  └──────────────────────────────────┬─────────────────────────────────────┘
                                     │ HTTP REST  /api/v1/*
                                     │ JSON
  ┌──────────────────────────────────▼─────────────────────────────────────┐
  │                         BACKEND API SERVER                             │
  │                                                                        │
  │   Node.js + Express.js + TypeScript                                    │
  │                                                                        │
  │   Runs on: http://localhost:3000                                        │
  │                                                                        │
  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
  │   │   Auth       │  │  Middleware  │  │   Route Handlers         │   │
  │   │   JWT sign   │  │  requirePerm │  │   /ideas                 │   │
  │   │   JWT verify │  │  reqStepAssign│  │   /workflow              │   │
  │   └──────────────┘  └──────────────┘  │   /kaizens               │   │
  │                                        │   /rewards               │   │
  │   ┌─────────────────────────────────┐  │   /master                │   │
  │   │   WORKFLOW ENGINE               │  │   /users                 │   │
  │   │   - Template loader             │  │   /notifications         │   │
  │   │   - Step generator              │  └──────────────────────────┘   │
  │   │   - Action processor            │                                  │
  │   │   - Return resolver             │  ┌──────────────────────────┐   │
  │   │   - Flag evaluator              │  │   ADAPTERS               │   │
  │   │   - Step inserter               │  │   FileStorageAdapter     │   │
  │   └─────────────────────────────────┘  │     local (now)          │   │
  │                                        │     S3 (future)          │   │
  │   ┌─────────────────────────────────┐  │   EmailAdapter           │   │
  │   │   SLA CRON JOB                  │  │     mock (now)           │   │
  │   │   runs every 15 min             │  │     MailHog (dev)        │   │
  │   │   reads workflow_steps          │  │     SES/SendGrid (prod)  │   │
  │   │   fires escalations             │  └──────────────────────────┘   │
  │   └─────────────────────────────────┘                                  │
  └──────────────────────────────────┬─────────────────────────────────────┘
                                     │ pg driver  port 5432
  ┌──────────────────────────────────▼─────────────────────────────────────┐
  │                         POSTGRESQL (Docker)                            │
  │                                                                        │
  │   Extensions:  pgvector (reserved for Phase 8 AI)                     │
  │   Container:   postgres:16-alpine                                      │
  │   Volume:      persistent local volume                                 │
  │                                                                        │
  │   Databases:                                                           │
  │     kiet_dev   (development)                                           │
  │     kiet_test  (integration tests)                                     │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │                         LOCAL FILE STORAGE                             │
  │                                                                        │
  │   /uploads/  (gitignored)                                              │
  │   DB stores: file_metadata.file_path → "./uploads/uuid-filename.ext"  │
  │   Binary: never in PostgreSQL                                          │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Monorepo Folder Structure

```
kaizen/                           ← root of GitHub repo
│
├── package.json                  ← pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json            ← shared TS config
├── .gitignore
├── .env.example                  ← env var template (no secrets)
│
├── packages/
│   ├── shared/                   ← @kiet/shared
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── types/            ← shared TypeScript types + interfaces
│   │   │   │   ├── idea.ts
│   │   │   │   ├── kaizen.ts
│   │   │   │   ├── workflow.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── index.ts
│   │   │   ├── constants/        ← shared enum values, permission codes
│   │   │   │   ├── permissions.ts
│   │   │   │   ├── workflow-stages.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── tsconfig.json
│   │
│   ├── backend/                  ← @kiet/backend (Express API)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts          ← app entry point
│   │   │   ├── app.ts            ← Express app setup
│   │   │   ├── config/
│   │   │   │   ├── database.ts   ← pg pool config
│   │   │   │   └── env.ts        ← env var validation (zod)
│   │   │   ├── middleware/
│   │   │   │   ├── authenticate.ts
│   │   │   │   ├── requirePermission.ts
│   │   │   │   └── requireStepAssignment.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── ideas.ts
│   │   │   │   ├── kaizens.ts
│   │   │   │   ├── workflow.ts
│   │   │   │   ├── rewards.ts
│   │   │   │   ├── master.ts
│   │   │   │   ├── users.ts
│   │   │   │   ├── files.ts
│   │   │   │   └── notifications.ts
│   │   │   ├── controllers/      ← thin request/response handlers
│   │   │   ├── services/         ← business logic
│   │   │   │   ├── workflow/
│   │   │   │   │   ├── engine.ts         ← ONE workflow engine
│   │   │   │   │   ├── step-generator.ts
│   │   │   │   │   ├── return-resolver.ts
│   │   │   │   │   ├── flag-evaluator.ts
│   │   │   │   │   └── step-inserter.ts
│   │   │   │   ├── ideas.service.ts
│   │   │   │   ├── kaizens.service.ts
│   │   │   │   ├── rewards.service.ts
│   │   │   │   ├── notifications.service.ts
│   │   │   │   └── sla.cron.ts
│   │   │   ├── adapters/
│   │   │   │   ├── file-storage/
│   │   │   │   │   ├── index.ts          ← interface
│   │   │   │   │   ├── local.adapter.ts  ← active in dev
│   │   │   │   │   └── s3.adapter.ts     ← future (Phase 6+)
│   │   │   │   └── email/
│   │   │   │       ├── index.ts          ← interface
│   │   │   │       ├── mock.adapter.ts   ← active in dev
│   │   │   │       └── smtp.adapter.ts   ← future (Phase 6+)
│   │   │   ├── db/
│   │   │   │   ├── migrations/           ← numbered SQL migration files
│   │   │   │   │   ├── 001_initial_schema.sql
│   │   │   │   │   ├── 002_seed_roles.sql
│   │   │   │   │   └── 003_seed_workflow_templates.sql
│   │   │   │   └── queries/              ← typed SQL query functions
│   │   │   └── utils/
│   │   │       ├── id-generator.ts       ← registration_id / kaizen_id
│   │   │       └── response.ts           ← success/error envelope builders
│   │   └── tests/
│   │       ├── integration/
│   │       └── unit/
│   │
│   └── frontend/                 ← @kiet/frontend (React app)
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── router/
│           │   └── index.tsx     ← React Router v6 routes
│           ├── api/              ← TanStack Query hooks + fetch wrappers
│           │   ├── ideas.ts
│           │   ├── workflow.ts
│           │   ├── kaizens.ts
│           │   └── index.ts
│           ├── components/       ← reusable UI components
│           │   ├── ui/           ← base elements (Button, Input, Modal...)
│           │   ├── IdeaForm/
│           │   ├── WorkflowTimeline/
│           │   ├── OnePagerForm/
│           │   └── ...
│           ├── pages/            ← route-level page components
│           │   ├── ideas/
│           │   ├── kaizens/
│           │   ├── rewards/
│           │   ├── admin/
│           │   └── ...
│           ├── store/            ← auth state (JWT, user, permissions)
│           └── utils/
│
├── docs/
│   └── architecture/
│       ├── workflow-state-machine.md  ← Phase 0 deliverable
│       ├── er-diagram.md              ← Phase 0 deliverable
│       ├── role-matrix.md             ← Phase 0 deliverable
│       ├── api-contract.md            ← Phase 0 deliverable
│       └── system-architecture.md    ← this file
│
└── scripts/
    ├── db-migrate.sh             ← run migrations in order
    ├── db-seed.sh                ← seed roles, permissions, templates
    └── db-reset.sh               ← drop + recreate + migrate + seed (dev only)
```

---

## 4. Development Environment Setup

```
Prerequisites:
  Node.js 20 LTS
  pnpm 9+
  Docker Desktop
  Git

Local stack:
  PostgreSQL 16 (Docker container)
  Backend API  (Node.js, port 3000)
  Frontend     (Vite dev server, port 5173)

Commands:
  pnpm install                    ← install all workspace deps
  docker compose up -d            ← start PostgreSQL
  pnpm --filter backend migrate   ← run SQL migrations
  pnpm --filter backend seed      ← seed roles + templates
  pnpm --filter backend dev       ← start API with ts-node-dev
  pnpm --filter frontend dev      ← start Vite dev server
```

### `docker-compose.yml` (root level)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: kiet
      POSTGRES_PASSWORD: kiet_local
      POSTGRES_DB: kiet_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### `.env.example`

```
# Backend
DATABASE_URL=postgresql://kiet:kiet_local@localhost:5432/kiet_dev
JWT_SECRET=change_this_in_production
JWT_EXPIRES_IN=24h
PORT=3000

# File Storage
FILE_STORAGE_ADAPTER=local
FILE_STORAGE_LOCAL_PATH=./uploads

# Email
EMAIL_ADAPTER=mock

# Frontend
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 5. Request Lifecycle

```
Browser Request
    │
    ▼
React Component
    │  useQuery / useMutation (TanStack Query)
    ▼
API fetch wrapper (/api/ideas.ts)
    │  Authorization: Bearer <jwt>
    ▼
Express Router (/routes/ideas.ts)
    │
    ├── authenticate middleware (verify JWT, attach req.user)
    │
    ├── requirePermission('CAN_SUBMIT_IDEA') middleware
    │     → reads req.user.permissions[]
    │     → 403 if missing
    │
    ▼
Controller (thin) (/controllers/ideas.controller.ts)
    │  validates request body (zod schema)
    ▼
Service (/services/ideas.service.ts)
    │
    ├── DB query via pg pool
    │
    ├── [if submission] → WorkflowEngine.initiate(IDEA_APPROVAL, idea.id)
    │       └── loads template → generates steps → creates workflow_instance
    │
    ├── [if workflow action] → WorkflowEngine.processAction(...)
    │       └── validates → updates step → resolves return / advances
    │
    ├── [notifications] → NotificationsService.send(...)
    │       └── inserts notifications row
    │       └── EmailAdapter.send(...)  ← mock/MailHog/SMTP
    │
    └── [files] → FileStorageAdapter.store(...)  ← local/S3/Azure
```

---

## 6. Shared Types Contract

`@kiet/shared` is imported by both `@kiet/backend` and `@kiet/frontend`. This enforces type consistency across the API boundary.

```typescript
// packages/shared/src/types/workflow.ts
export type WorkflowType = 'IDEA_APPROVAL' | 'IMPLEMENTATION_APPROVAL'
export type WorkflowStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'RETURNED' | 'REJECTED' | 'COMPLETED'
export type StepStatus = 'PENDING' | 'APPROVED' | 'RETURNED' | 'REJECTED' | 'SKIPPED'

// packages/shared/src/constants/permissions.ts
export const PERMISSIONS = {
  CAN_SUBMIT_IDEA: 'CAN_SUBMIT_IDEA',
  CAN_APPROVE_IDEA: 'CAN_APPROVE_IDEA',
  // ...
} as const
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]
```

---

## 7. Adapter Interface Contracts

### File Storage Adapter

```typescript
// packages/backend/src/adapters/file-storage/index.ts
export interface FileStorageAdapter {
  store(file: Express.Multer.File): Promise<{ path: string; checksum: string }>
  retrieve(path: string): Promise<Buffer>
  delete(path: string): Promise<void>
}
```

### Email Adapter

```typescript
// packages/backend/src/adapters/email/index.ts
export interface EmailAdapter {
  send(opts: {
    to: string
    subject: string
    body: string
    templateId?: string
    variables?: Record<string, string>
  }): Promise<void>
}
```

Both adapters are injected at startup via `config/env.ts` reading `FILE_STORAGE_ADAPTER` and `EMAIL_ADAPTER` env vars.

---

## 8. Branch Strategy

| Phase | Branch Name | Merges into |
|---|---|---|
| 0 | `feature/architecture-foundation` | `feature/project-scaffold` |
| 1 | `feature/database-schema` | `main` |
| 2 | `feature/backend-auth-rbac` | `main` |
| 3 | `feature/workflow-engine` | `main` |
| 4 | `feature/idea-submission-approval` | `main` |
| 5 | `feature/implementation-one-pager` | `main` |
| 6 | `feature/rewards-recognition` | `main` |
| 7 | `feature/notifications-sla` | `main` |
| 8 | `feature/reporting-dashboard` | `main` |
| Future AI | `feature/ai-duplicate-detection` | `main` |

---

## 9. Future State (not built now — documented for continuity)

| Concern | Current | Future |
|---|---|---|
| File storage | Local filesystem | AWS S3 / Azure Blob / MinIO |
| Email | Mock / MailHog | AWS SES / SendGrid |
| AI duplicate detection | Not built (pgvector reserved) | Phase 8 — `idea_embeddings` + LLM integration |
| Auth | JWT (local) | SSO / Azure AD (if required) |
| Deployment | Local Docker | Containerized — any PaaS / on-prem |
| Database | Single PostgreSQL | Read replica if scale demands |

---

*Phase 0 Architecture Foundation complete.*  
*All five deliverables produced:*  
*Workflow State Machine · ER Diagram · Role Matrix · API Contract · System Architecture*

*Next: Phase 1 — Database Schema (branch: `feature/database-schema`)*
