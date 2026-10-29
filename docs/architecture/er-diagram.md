# KIET — Entity Relationship Diagram
## Phase 0 · Architecture Foundation

**Document version:** 1.0  
**Branch:** `feature/architecture-foundation`  
**BRD reference:** Sections 5, 9.4, 10, 13  
**Status:** Authoritative — implement database migrations from this document

---

## 1. Schema Overview

The schema is organized into **six logical domains**:

| Domain | Purpose | Tables |
|---|---|---|
| **Identity & RBAC** | Users, roles, permissions | `users`, `roles`, `permissions`, `role_permissions`, `user_roles` |
| **Org Hierarchy** | Plant/Zone/Dept/Function/Hall/Location | `plants`, `zones`, `departments`, `functions`, `halls`, `locations` |
| **Master Data** | Configurable lookup values | `categories`, `sub_categories`, `tags`, `sla_configs` |
| **Idea Lifecycle** | Idea capture through approval | `ideas`, `idea_tags`, `idea_attachments` |
| **Implementation & Kaizen** | One Pager, implementation | `kaizens`, `kaizen_attachments`, `sci_tech_documents` |
| **Workflow Engine** | ONE engine driving both workflows | `workflow_templates`, `workflow_template_steps`, `workflow_instances`, `workflow_steps`, `workflow_flags` |
| **Rewards & Recognition** | All R&R nomination pipelines | `rewards`, `high_impact_nominations`, `sc_ratings`, `inter_plant_nominations` |
| **Cross-cutting** | Notifications, files, audit | `notifications`, `file_metadata`, `audit_logs` |

---

## 2. Entity Relationship Diagram

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                         IDENTITY & RBAC DOMAIN                                       ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────┐    ┌─────────────────────────────────────┐
│ users                            │    │ roles                               │
│──────────────────────────────────│    │─────────────────────────────────────│
│ PK  id            UUID           │    │ PK  id           UUID               │
│     employee_id   VARCHAR(50) UQ │    │     name         VARCHAR(100) UQ    │
│     email         VARCHAR(255) UQ│    │     description  TEXT               │
│     full_name     VARCHAR(255)   │    │     is_active     BOOLEAN DEFAULT T │
│     phone         VARCHAR(20)    │    │     created_at   TIMESTAMPTZ        │
│     is_active     BOOLEAN        │    └──────────────────┬──────────────────┘
│     created_at    TIMESTAMPTZ    │                       │
│     updated_at    TIMESTAMPTZ    │    ┌──────────────────▼──────────────────┐
└────────────────┬─────────────────┘    │ role_permissions                    │
                 │                      │─────────────────────────────────────│
                 │   ┌──────────────────│ FK  role_id       → roles.id        │
    ┌────────────▼───▼──────────────┐   │ FK  permission_id → permissions.id  │
    │ user_roles                    │   └─────────────────────────────────────┘
    │───────────────────────────────│
    │ FK  user_id    → users.id     │   ┌─────────────────────────────────────┐
    │ FK  role_id    → roles.id     │   │ permissions                         │
    │ FK  plant_id   → plants.id    │   │─────────────────────────────────────│
    │     granted_at TIMESTAMPTZ    │   │ PK  id           UUID               │
    │     granted_by → users.id     │   │     code         VARCHAR(100) UQ    │
    │ PK  (user_id, role_id,        │   │     description  TEXT               │
    │      plant_id)                │   │  Examples:                          │
    └───────────────────────────────┘   │    CAN_SUBMIT_IDEA                  │
                                        │    CAN_APPROVE_IDEA                 │
                                        │    CAN_APPROVE_IMPLEMENTATION       │
                                        │    CAN_ASSIGN_REWARD                │
                                        │    CAN_MANAGE_USERS                 │
                                        │    CAN_MANAGE_MASTER_DATA           │
                                        │    CAN_VIEW_REPORTS                 │
                                        └─────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════════════╗
║                       ORG HIERARCHY DOMAIN                                           ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ plants       │   │ zones        │   │ departments  │   │ functions    │   │ halls        │   │ locations    │
│──────────────│   │──────────────│   │──────────────│   │──────────────│   │──────────────│   │──────────────│
│ PK id  UUID  │◄──│ FK plant_id  │◄──│ FK plant_id  │   │ FK dept_id   │◄──│ FK func_id   │◄──│ FK     hall_id│
│    name      │   │ PK id  UUID  │   │ FK zone_id   │   │ PK id  UUID  │   │ PK id  UUID  │   │ PK id  UUID  │
│    code      │   │    name      │   │ PK id  UUID  │   │    name      │   │    name      │   │    name      │
│    address   │   │    code      │   │    name      │   │    code      │   │    code      │   │    code      │
│    is_active │   │    is_active │   │    code      │   │    is_active │   │    is_active │   │    is_active │
└──────────────┘   └──────────────┘   │    is_active │   └──────────────┘   └──────────────┘   └──────────────┘
                                       └──────────────┘

    Plant → Zone → Department → Function → Hall → Location
    (Approver determination derives from this hierarchy at runtime)

╔══════════════════════════════════════════════════════════════════════════════════════╗
║                         MASTER DATA DOMAIN                                           ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌────────────────────────────┐   ┌────────────────────────────┐   ┌─────────────────────────────────┐
│ categories                 │   │ sub_categories             │   │ sla_configs                     │
│────────────────────────────│   │────────────────────────────│   │─────────────────────────────────│
│ PK  id       UUID          │◄──│ FK  category_id            │   │ PK  id            UUID          │
│     name     VARCHAR(255)  │   │ PK  id       UUID          │   │ FK  plant_id      → plants.id   │
│     code     VARCHAR(50)UQ │   │     name     VARCHAR(255)  │   │     stage_code    VARCHAR(100)  │
│     is_active BOOLEAN      │   │     code     VARCHAR(50)UQ │   │     workflow_type VARCHAR(50)   │
└────────────────────────────┘   │     is_active BOOLEAN      │   │     sla_hours     INTEGER       │
                                  └────────────────────────────┘   │     reminder_hrs  INTEGER       │
                                                                    │     escalate_to_role VARCHAR   │
                                  ┌────────────────────────────┐   │     second_esc_hrs INTEGER     │
                                  │ tags                       │   │     is_active     BOOLEAN      │
                                  │────────────────────────────│   │ UQ  (plant_id, stage_code,    │
                                  │ PK  id       UUID          │   │      workflow_type)            │
                                  │     name     VARCHAR(100)UQ│   └─────────────────────────────────┘
                                  │     color    VARCHAR(7)    │
                                  │     is_active BOOLEAN      │
                                  └────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════════════╗
║                         IDEA LIFECYCLE DOMAIN                                      ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────┐
│ ideas                                                                    │
│──────────────────────────────────────────────────────────────────────────│
│ PK   id                UUID                                              │
│      registration_id   VARCHAR(20) UQ   ← generated on submission       │
│ FK   submitted_by      → users.id                                        │
│ FK   plant_id          → plants.id                                       │
│ FK   zone_id           → zones.id                                        │
│ FK   department_id     → departments.id                                  │
│ FK   function_id       → functions.id                                    │
│ FK   hall_id           → halls.id                                        │
│ FK   location_id       → locations.id                                    │
│ FK   category_id       → categories.id                                   │
│ FK   sub_category_id   → sub_categories.id                               │
│      title             VARCHAR(500)                                      │
│      description       TEXT                                              │
│      problem_statement TEXT                                              │
│      proposed_solution TEXT                                              │
│      expected_benefits TEXT                                              │
│      is_anonymous      BOOLEAN DEFAULT FALSE                             │
│      status            VARCHAR(50)                                       │
│         ← MINIMAL: DRAFT | SUBMITTED | APPROVED | REJECTED              │
│         ← Fine-grained status lives in workflow_instance.current_stage  │
│      submitted_at      TIMESTAMPTZ                                       │
│      created_at        TIMESTAMPTZ                                       │
│      updated_at        TIMESTAMPTZ                                       │
└──────────────────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌───────────────────┐  ┌───────────────────────────────────────────────────┐
│ idea_tags         │  │ idea_attachments                                  │
│───────────────────│  │───────────────────────────────────────────────────│
│ FK  idea_id       │  │ PK  id              UUID                          │
│ FK  tag_id        │  │ FK  idea_id         → ideas.id                    │
│ PK  (idea_id,     │  │ FK  file_id         → file_metadata.id            │
│      tag_id)      │  │     attachment_type VARCHAR(50)  ← SUPPORTING_DOC│
└───────────────────┘  └───────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════════════╗
║                      IMPLEMENTATION & KAIZEN DOMAIN                                ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────┐
│ kaizens                                                                          │
│──────────────────────────────────────────────────────────────────────────────────│
│ PK   id                  UUID                                                    │
│      kaizen_id           VARCHAR(20) UQ  ← generated when One Pager opened      │
│ FK   idea_id             → ideas.id  UQ  ← 1:1 with idea                        │
│ FK   implementation_owner → users.id                                             │
│ FK   assigned_by         → users.id                                              │
│      title               VARCHAR(500)                                            │
│      before_description  TEXT                                                    │
│      after_description   TEXT                                                    │
│      benefits_achieved   TEXT                                                    │
│      cost_savings        DECIMAL(15,2)                                           │
│      productivity_gain   TEXT                                                    │
│      quality_improvement TEXT                                                    │
│      safety_improvement  TEXT                                                    │
│      implementation_date DATE                                                    │
│      status              VARCHAR(50)                                             │
│         ← MINIMAL: PENDING | IN_PROGRESS | ONE_PAGER_SUBMITTED |                │
│                    APPROVED | REJECTED                                           │
│      one_pager_submitted_at  TIMESTAMPTZ                                         │
│      created_at              TIMESTAMPTZ                                         │
│      updated_at              TIMESTAMPTZ                                         │
└──────────────────────────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌───────────────────────────────┐  ┌───────────────────────────────────────────────┐
│ kaizen_attachments            │  │ sci_tech_documents                            │
│───────────────────────────────│  │───────────────────────────────────────────────│
│ PK  id              UUID      │  │ PK  id              UUID                      │
│ FK  kaizen_id       → kaizens │  │ FK  kaizen_id       → kaizens.id              │
│ FK  file_id         → file_metadata│  FK  file_id    → file_metadata.id          │
│     attachment_type VARCHAR(50)│  │ FK  uploaded_by     → users.id               │
│        BEFORE_PHOTO           │  │     document_type   VARCHAR(100)              │
│        AFTER_PHOTO            │  │     uploaded_at     TIMESTAMPTZ               │
│        SUPPORTING_DOC         │  └───────────────────────────────────────────────┘
└───────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════════════╗
║                         WORKFLOW ENGINE DOMAIN                                     ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────────────────┐
│ workflow_templates                                                    │
│───────────────────────────────────────────────────────────────────────│
│ PK  id             UUID                                               │
│     workflow_type  VARCHAR(50) UQ                                     │
│        IDEA_APPROVAL | IMPLEMENTATION_APPROVAL                        │
│     name           VARCHAR(255)                                       │
│     description    TEXT                                               │
│     is_active      BOOLEAN DEFAULT TRUE                               │
│     created_at     TIMESTAMPTZ                                        │
└──────────────────────────────────┬────────────────────────────────────┘
                                   │
                                   ▼
┌───────────────────────────────────────────────────────────────────────┐
│ workflow_template_steps                                               │
│───────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                              │
│ FK  template_id     → workflow_templates.id                           │
│     step_order      INTEGER                                           │
│     stage_code      VARCHAR(100)                                      │
│        ZONE_LEADER_REVIEW | HOD_REVIEW                                │
│        (base steps only — dynamic steps inserted at runtime)          │
│     assigned_role   VARCHAR(100)   ← role code, not user ID          │
│     is_dynamic      BOOLEAN DEFAULT FALSE                             │
│     sla_hours       INTEGER        ← default SLA for this step        │
│ UQ  (template_id, step_order)                                         │
└───────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────┐
│ workflow_instances                                                    │
│───────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                              │
│ FK  template_id     → workflow_templates.id                           │
│     entity_type     VARCHAR(50)   idea | kaizen                       │
│ FK  entity_id       UUID          → ideas.id OR kaizens.id           │
│     workflow_type   VARCHAR(50)   IDEA_APPROVAL | IMPLEMENTATION_...  │
│     current_stage   VARCHAR(100)  ← WHERE in workflow                │
│     current_status  VARCHAR(50)   ← WHAT is happening                │
│        PENDING | IN_PROGRESS | APPROVED | RETURNED | REJECTED |      │
│        COMPLETED                                                      │
│ FK  initiated_by    → users.id                                        │
│     initiated_at    TIMESTAMPTZ                                       │
│     completed_at    TIMESTAMPTZ NULL                                  │
│     created_at      TIMESTAMPTZ                                       │
│     updated_at      TIMESTAMPTZ                                       │
└──────────────────────────────────┬────────────────────────────────────┘
                                   │
                  ┌────────────────┴────────────────┐
                  ▼                                 ▼
┌────────────────────────────────┐  ┌────────────────────────────────────┐
│ workflow_steps                 │  │ workflow_flags                     │
│────────────────────────────────│  │────────────────────────────────────│
│ PK  id              UUID       │  │ PK  id              UUID           │
│ FK  workflow_instance_id       │  │ FK  workflow_instance_id           │
│       → workflow_instances.id  │  │       → workflow_instances.id UQ   │
│     step_order      INTEGER    │  │     machine_design_change BOOLEAN  │
│     stage_code      VARCHAR    │  │        DEFAULT FALSE               │
│     assigned_user_id → users.id│  │     safety_review_required BOOLEAN │
│     status          VARCHAR(50)│  │        DEFAULT FALSE               │
│        PENDING | APPROVED |    │  │     qms_review_required   BOOLEAN  │
│        RETURNED | REJECTED |   │  │        DEFAULT FALSE               │
│        SKIPPED                 │  │     sci_tech_required     BOOLEAN  │
│     comment         TEXT NULL  │  │        DEFAULT FALSE               │
│     action_taken_at TIMESTAMPTZ│  │     set_by_user_id → users.id NULL │
│     action_assigned_at TIMESTAMPTZ│  │  set_at        TIMESTAMPTZ NULL │
│     sla_due_at      TIMESTAMPTZ│  └────────────────────────────────────┘
│     escalated       BOOLEAN    │
│        DEFAULT FALSE           │
│     is_dynamic      BOOLEAN    │
│        DEFAULT FALSE           │
│     created_at      TIMESTAMPTZ│
└────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════════════╗
║                      REWARDS & RECOGNITION DOMAIN                                  ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────┐
│ rewards                                                                  │
│──────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                 │
│ FK  kaizen_id       → kaizens.id                                         │
│ FK  assigned_by     → users.id  ← Plant OPEX                            │
│     reward_type     VARCHAR(50)                                          │
│        REGULAR | SPECIAL                                                 │
│     reward_amount   DECIMAL(10,2) NULL                                   │
│     reward_details  TEXT                                                 │
│     assigned_at     TIMESTAMPTZ                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ high_impact_nominations                                                  │
│──────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                 │
│ FK  kaizen_id       → kaizens.id                                         │
│ FK  nominated_by    → users.id  ← Plant OPEX                            │
│     nomination_status VARCHAR(50)                                        │
│        PENDING_RATINGS | RATINGS_COMPLETE | NOMINATED_SPECIAL |         │
│        NOMINATED_INTER_PLANT | CLOSED                                   │
│     nominated_at    TIMESTAMPTZ                                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ sc_ratings                                                               │
│──────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                 │
│ FK  nomination_id   → high_impact_nominations.id                         │
│ FK  sc_member_id    → users.id  ← Steering Committee member             │
│     rating_score    DECIMAL(3,1)  ← configurable scale                  │
│     rating_notes    TEXT                                                 │
│     has_rated       BOOLEAN DEFAULT FALSE                                │
│     rated_at        TIMESTAMPTZ NULL                                     │
│ UQ  (nomination_id, sc_member_id)                                        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ inter_plant_nominations                                                  │
│──────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                 │
│ FK  kaizen_id       → kaizens.id                                         │
│ FK  nomination_id   → high_impact_nominations.id NULL                    │
│ FK  nominated_by    → users.id  ← Plant OPEX                            │
│     competition_year INTEGER                                             │
│     competition_round VARCHAR(50)  ← PLANT | CLUSTER | NATIONAL        │
│     result          VARCHAR(50) NULL ← WON | RUNNER_UP | PARTICIPATED   │
│     nominated_at    TIMESTAMPTZ                                          │
└──────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════════════════╗
║                         CROSS-CUTTING DOMAIN                                       ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────┐
│ file_metadata                                                            │
│──────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                 │
│     file_name       VARCHAR(500)  ← original file name                  │
│     file_path       TEXT          ← storage path (local/S3/Azure/Minio) │
│     file_size       BIGINT        ← bytes                               │
│     content_type    VARCHAR(200)  ← MIME type                           │
│ FK  uploaded_by     → users.id                                           │
│     uploaded_at     TIMESTAMPTZ                                          │
│     storage_backend VARCHAR(50) DEFAULT 'local'                          │
│        local | s3 | azure_blob | minio                                  │
│     checksum        VARCHAR(64) NULL  ← SHA-256                         │
│   ← Binary data NEVER stored here. Path only.                           │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ notifications                                                            │
│──────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                 │
│ FK  recipient_id    → users.id                                           │
│     notification_type VARCHAR(100)                                       │
│        IDEA_SUBMITTED | STEP_ASSIGNED | STEP_APPROVED |                 │
│        STEP_RETURNED | IDEA_APPROVED | KAIZEN_APPROVED |                │
│        SLA_REMINDER | SLA_ESCALATED | REWARD_ASSIGNED                  │
│     title           VARCHAR(500)                                         │
│     body            TEXT                                                 │
│     entity_type     VARCHAR(50) NULL   idea | kaizen                    │
│     entity_id       UUID NULL                                            │
│     is_read         BOOLEAN DEFAULT FALSE                                │
│     read_at         TIMESTAMPTZ NULL                                     │
│     created_at      TIMESTAMPTZ                                          │
│   ← Email abstraction: notification row created, email adapter reads it │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ audit_logs                                                               │
│──────────────────────────────────────────────────────────────────────────│
│ PK  id              UUID                                                 │
│ FK  performed_by    → users.id                                           │
│     action          VARCHAR(100)  ← see workflow-state-machine.md §11   │
│     entity_type     VARCHAR(50)   idea | kaizen | workflow_step | etc.  │
│     entity_id       UUID                                                 │
│     payload         JSONB NULL    ← snapshot of relevant fields         │
│     ip_address      VARCHAR(45) NULL                                     │
│     performed_at    TIMESTAMPTZ                                          │
│   ← IMMUTABLE. Never update or delete rows.                             │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Relationship Summary

```
users           ──< user_roles >── roles ──< role_permissions >── permissions
users           ──< ideas
ideas           ──< idea_tags >── tags
ideas           ──< idea_attachments >── file_metadata
ideas           ──  kaizens (1:1)
kaizens         ──< kaizen_attachments >── file_metadata
kaizens         ──< sci_tech_documents >── file_metadata
kaizens         ──< rewards
kaizens         ──< high_impact_nominations ──< sc_ratings
kaizens         ──< inter_plant_nominations

workflow_templates     ──< workflow_template_steps
workflow_templates     ──< workflow_instances
workflow_instances     ──< workflow_steps
workflow_instances     ──  workflow_flags (1:1)

ideas/kaizens   ──  workflow_instances (via entity_type + entity_id polymorphic)

users ──< notifications
users/ideas/kaizens/workflow_steps ──< audit_logs (polymorphic)

plants ──< zones ──< departments ──< functions ──< halls ──< locations
plants ──< sla_configs
```

---

## 4. Key Constraints and Indexes

```sql
-- Identity
CREATE UNIQUE INDEX ON users(employee_id);
CREATE UNIQUE INDEX ON users(email);

-- Org hierarchy
CREATE UNIQUE INDEX ON plants(code);
CREATE UNIQUE INDEX ON zones(code, plant_id);

-- Ideas
CREATE UNIQUE INDEX ON ideas(registration_id);
CREATE INDEX ON ideas(submitted_by);
CREATE INDEX ON ideas(plant_id);
CREATE INDEX ON ideas(status);

-- Kaizens
CREATE UNIQUE INDEX ON kaizens(kaizen_id);
CREATE UNIQUE INDEX ON kaizens(idea_id);
CREATE INDEX ON kaizens(implementation_owner);
CREATE INDEX ON kaizens(status);

-- Workflow
CREATE UNIQUE INDEX ON workflow_templates(workflow_type);
CREATE INDEX ON workflow_instances(entity_type, entity_id);
CREATE INDEX ON workflow_instances(current_stage, current_status);
CREATE INDEX ON workflow_steps(workflow_instance_id, status);
CREATE INDEX ON workflow_steps(assigned_user_id, status);
CREATE INDEX ON workflow_steps(sla_due_at) WHERE escalated = FALSE;

-- SLA configs
CREATE UNIQUE INDEX ON sla_configs(plant_id, stage_code, workflow_type);

-- SC ratings
CREATE UNIQUE INDEX ON sc_ratings(nomination_id, sc_member_id);

-- Audit (write-heavy, no updates)
CREATE INDEX ON audit_logs(entity_type, entity_id);
CREATE INDEX ON audit_logs(performed_by);
CREATE INDEX ON audit_logs(performed_at DESC);

-- Notifications
CREATE INDEX ON notifications(recipient_id, is_read);
```

---

## 5. AI Future-Readiness Reservation

```sql
-- Reserved for Phase 8: AI Duplicate Detection
-- Branch: feature/ai-duplicate-detection
-- Tables NOT created now — documented here as reserved schema

-- idea_embeddings
--   id              UUID PK
--   idea_id         UUID FK → ideas.id
--   embedding       VECTOR(1536)   ← pgvector extension
--   model_version   VARCHAR(100)
--   created_at      TIMESTAMPTZ

-- embedding_jobs
--   id              UUID PK
--   idea_id         UUID FK → ideas.id
--   status          VARCHAR(50)   QUEUED | PROCESSING | DONE | FAILED
--   error           TEXT NULL
--   created_at      TIMESTAMPTZ
--   processed_at    TIMESTAMPTZ NULL
```

---

## 6. Enum Values Reference

All enums are **stored as VARCHAR** (not PostgreSQL ENUM types) for migration flexibility.

| Column | Valid Values |
|---|---|
| `users.` — (no enum columns) | — |
| `ideas.status` | `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` |
| `kaizens.status` | `PENDING`, `IN_PROGRESS`, `ONE_PAGER_SUBMITTED`, `APPROVED`, `REJECTED` |
| `workflow_templates.workflow_type` | `IDEA_APPROVAL`, `IMPLEMENTATION_APPROVAL` |
| `workflow_instances.current_status` | `PENDING`, `IN_PROGRESS`, `APPROVED`, `RETURNED`, `REJECTED`, `COMPLETED` |
| `workflow_steps.status` | `PENDING`, `APPROVED`, `RETURNED`, `REJECTED`, `SKIPPED` |
| `notifications.notification_type` | `IDEA_SUBMITTED`, `STEP_ASSIGNED`, `STEP_APPROVED`, `STEP_RETURNED`, `IDEA_APPROVED`, `KAIZEN_APPROVED`, `SLA_REMINDER`, `SLA_ESCALATED`, `REWARD_ASSIGNED` |
| `rewards.reward_type` | `REGULAR`, `SPECIAL` |
| `high_impact_nominations.nomination_status` | `PENDING_RATINGS`, `RATINGS_COMPLETE`, `NOMINATED_SPECIAL`, `NOMINATED_INTER_PLANT`, `CLOSED` |
| `inter_plant_nominations.competition_round` | `PLANT`, `CLUSTER`, `NATIONAL` |
| `inter_plant_nominations.result` | `WON`, `RUNNER_UP`, `PARTICIPATED` |
| `idea_attachments.attachment_type` | `SUPPORTING_DOC` |
| `kaizen_attachments.attachment_type` | `BEFORE_PHOTO`, `AFTER_PHOTO`, `SUPPORTING_DOC` |
| `file_metadata.storage_backend` | `local`, `s3`, `azure_blob`, `minio` |
| `audit_logs.action` | See workflow-state-machine.md §11 |

---

*Document end. Next: Role Matrix → API Contract → System Architecture.*
