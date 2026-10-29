# KIET — API Contract
## Phase 0 · Architecture Foundation

**Document version:** 1.0  
**Branch:** `feature/architecture-foundation`  
**BRD reference:** Sections 5, 9, 10, 11, 12  
**Status:** Authoritative — backend route definitions derive from this document

---

## 1. Global Conventions

### 1.1 Base URL

```
/api/v1
```

All routes are prefixed with `/api/v1`.

### 1.2 Authentication

All endpoints (except `/auth/*`) require a valid JWT in the Authorization header:

```
Authorization: Bearer <token>
```

JWT payload:
```json
{
  "sub": "<user_id>",
  "email": "<email>",
  "plant_id": "<plant_id>",
  "permissions": ["CAN_SUBMIT_IDEA", "CAN_APPROVE_IDEA", "..."],
  "iat": 1700000000,
  "exp": 1700086400
}
```

### 1.3 Response Envelope

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 150
  }
}
```
`meta` is only present for paginated list responses.

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [ ... ]
  }
}
```

### 1.4 Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/params failed validation |
| `UNAUTHENTICATED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Valid JWT, insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate or state conflict |
| `WORKFLOW_ERROR` | 422 | Invalid workflow transition attempted |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### 1.5 Pagination

All list endpoints accept:
```
?page=1&page_size=20&sort_by=created_at&sort_dir=desc
```

---

## 2. Auth Endpoints

### `POST /api/v1/auth/login`
**Permission:** None (public)

**Request:**
```json
{
  "email": "user@acg.com",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "expires_in": 86400,
    "user": {
      "id": "uuid",
      "full_name": "string",
      "email": "string",
      "plant_id": "uuid",
      "permissions": ["CAN_SUBMIT_IDEA", "..."]
    }
  }
}
```

### `POST /api/v1/auth/refresh`
**Permission:** Valid (possibly expired) JWT

**Response `200`:** Same as login response.

### `POST /api/v1/auth/logout`
**Permission:** Authenticated

**Response `200`:** `{ "success": true, "data": null }`

---

## 3. Ideas Endpoints

### `GET /api/v1/ideas`
**Permission:** `CAN_VIEW_OWN_IDEAS` minimum  
**Scope:** filtered by permission level (own / zone / plant / all)

**Query params:**
```
status=SUBMITTED|APPROVED|REJECTED
plant_id=uuid
zone_id=uuid
category_id=uuid
page=1&page_size=20
```

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "registration_id": "KIET-2024-001",
      "title": "string",
      "status": "SUBMITTED",
      "submitted_by": { "id": "uuid", "full_name": "string" },
      "plant": { "id": "uuid", "name": "string" },
      "zone": { "id": "uuid", "name": "string" },
      "category": { "id": "uuid", "name": "string" },
      "current_stage": "HOD_REVIEW",
      "current_status": "PENDING",
      "submitted_at": "ISO8601",
      "created_at": "ISO8601"
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total": 47 }
}
```

### `POST /api/v1/ideas`
**Permission:** `CAN_SUBMIT_IDEA`

**Request:**
```json
{
  "title": "string (required, max 500)",
  "description": "string (required)",
  "problem_statement": "string (required)",
  "proposed_solution": "string (required)",
  "expected_benefits": "string (optional)",
  "is_anonymous": false,
  "plant_id": "uuid (required)",
  "zone_id": "uuid (required)",
  "department_id": "uuid (required)",
  "function_id": "uuid (optional)",
  "hall_id": "uuid (optional)",
  "location_id": "uuid (optional)",
  "category_id": "uuid (required)",
  "sub_category_id": "uuid (optional)",
  "tag_ids": ["uuid"],
  "attachment_file_ids": ["uuid"]
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "registration_id": "KIET-2024-047",
    "status": "SUBMITTED",
    "workflow_instance_id": "uuid",
    "current_stage": "ZONE_LEADER_REVIEW",
    "assigned_to": { "id": "uuid", "full_name": "Zone Leader Name" }
  }
}
```

### `GET /api/v1/ideas/:id`
**Permission:** `CAN_VIEW_OWN_IDEAS` (own) or `CAN_VIEW_ZONE_IDEAS` / `CAN_VIEW_PLANT_IDEAS`

**Response `200`:** Full idea object with workflow state, attachments, tags, timeline.

### `PUT /api/v1/ideas/:id`
**Permission:** `CAN_SUBMIT_IDEA` + must be submitter + idea.status = `DRAFT`  
Only allowed before submission.

### `DELETE /api/v1/ideas/:id`
**Permission:** `CAN_SUBMIT_IDEA` + must be submitter + idea.status = `DRAFT`

### `GET /api/v1/ideas/:id/timeline`
**Permission:** `CAN_VIEW_OWN_IDEAS` (own)

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "stage": "ZONE_LEADER_REVIEW",
      "status": "APPROVED",
      "actor": { "id": "uuid", "full_name": "string" },
      "comment": null,
      "action_taken_at": "ISO8601"
    }
  ]
}
```

---

## 4. File Upload Endpoint

### `POST /api/v1/files/upload`
**Permission:** Authenticated (any)  
**Content-Type:** `multipart/form-data`

**Request fields:**
```
file: <binary>
entity_type: idea | kaizen | sci_tech
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "file_id": "uuid",
    "file_name": "drawing.pdf",
    "file_size": 204800,
    "content_type": "application/pdf"
  }
}
```

*File IDs are referenced in subsequent idea/kaizen POST requests.*

---

## 5. Workflow Action Endpoints

### `POST /api/v1/workflow/ideas/:idea_id/action`
**Permission:** `CAN_APPROVE_IDEA` OR `CAN_REVIEW_SAFETY` OR `CAN_REVIEW_QUALITY`  
**Additional guard:** User must be `workflow_step.assigned_user_id`

**Request:**
```json
{
  "action": "APPROVE | RETURN | REJECT",
  "comment": "string (required for RETURN and REJECT)",
  "flags": {
    "machine_design_change": false,
    "safety_review_required": true,
    "qms_review_required": false
  }
}
```

`flags` is only accepted when `action = APPROVE` and the current stage is `HOD_REVIEW`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "workflow_instance_id": "uuid",
    "previous_stage": "HOD_REVIEW",
    "current_stage": "SAFETY_REVIEW",
    "current_status": "PENDING",
    "next_assignee": { "id": "uuid", "full_name": "Safety Officer Name" }
  }
}
```

### `POST /api/v1/workflow/kaizens/:kaizen_id/action`
**Permission:** `CAN_REVIEW_IMPLEMENTATION` OR `CAN_REVIEW_SME` OR `CAN_REVIEW_SAFETY` OR `CAN_REVIEW_QUALITY`  
**Additional guard:** User must be `workflow_step.assigned_user_id`

**Request:**
```json
{
  "action": "APPROVE | RETURN | REJECT",
  "comment": "string (required for RETURN and REJECT)",
  "flags": {
    "sci_tech_required": true
  }
}
```

`flags.sci_tech_required` only accepted when `action = APPROVE` and current stage is `SME_REVIEW`.

**Response `200`:** Same shape as idea workflow action response.

### `POST /api/v1/workflow/kaizens/:kaizen_id/sci-tech`
**Permission:** `CAN_UPLOAD_SCI_TECH`  
**Additional guard:** Current stage must be `SCI_TECH_UPLOAD` and user is assigned

**Request:**
```json
{
  "file_ids": ["uuid", "uuid"],
  "document_type": "SCI_TECH_DRAWING | SPECIFICATION | OTHER"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "uploaded_documents": 2,
    "current_stage": "KAIZEN_APPROVED",
    "current_status": "COMPLETED"
  }
}
```

### `GET /api/v1/workflow/ideas/:idea_id/status`
**Permission:** `CAN_VIEW_OWN_IDEAS`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "workflow_instance_id": "uuid",
    "workflow_type": "IDEA_APPROVAL",
    "current_stage": "SAFETY_REVIEW",
    "current_status": "PENDING",
    "steps": [
      {
        "step_order": 1,
        "stage_code": "ZONE_LEADER_REVIEW",
        "status": "APPROVED",
        "assigned_to": { "id": "uuid", "full_name": "string" },
        "action_taken_at": "ISO8601"
      },
      {
        "step_order": 2,
        "stage_code": "HOD_REVIEW",
        "status": "APPROVED",
        "assigned_to": { "id": "uuid", "full_name": "string" },
        "action_taken_at": "ISO8601"
      },
      {
        "step_order": 3,
        "stage_code": "SAFETY_REVIEW",
        "status": "PENDING",
        "assigned_to": { "id": "uuid", "full_name": "string" },
        "sla_due_at": "ISO8601"
      }
    ]
  }
}
```

---

## 6. Kaizen / One Pager Endpoints

### `GET /api/v1/kaizens`
**Permission:** `CAN_VIEW_OWN_IDEAS` minimum

**Query params:**
```
status=PENDING|IN_PROGRESS|ONE_PAGER_SUBMITTED|APPROVED|REJECTED
plant_id=uuid
page=1&page_size=20
```

### `GET /api/v1/kaizens/:id`
**Permission:** Access to related idea or `CAN_VIEW_PLANT_IDEAS`

**Response:** Full kaizen object with One Pager fields, attachments, workflow status.

### `PUT /api/v1/kaizens/:id/mark-implemented`
**Permission:** `CAN_MARK_IMPLEMENTED` + must be implementation owner

**Request:**
```json
{
  "implementation_date": "2024-03-15"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "kaizen_id": "KIET-K-2024-001",
    "status": "IN_PROGRESS"
  }
}
```

### `PUT /api/v1/kaizens/:id/one-pager`
**Permission:** `CAN_SUBMIT_ONE_PAGER` + must be implementation owner

**Request:**
```json
{
  "title": "string (required)",
  "before_description": "string (required)",
  "after_description": "string (required)",
  "benefits_achieved": "string (required)",
  "cost_savings": 15000.00,
  "productivity_gain": "string",
  "quality_improvement": "string",
  "safety_improvement": "string",
  "implementation_date": "2024-03-15",
  "before_photo_file_ids": ["uuid"],
  "after_photo_file_ids": ["uuid"],
  "supporting_doc_file_ids": ["uuid"],
  "action": "SAVE_DRAFT | SUBMIT"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "kaizen_id": "KIET-K-2024-001",
    "status": "ONE_PAGER_SUBMITTED",
    "workflow_instance_id": "uuid",
    "current_stage": "ZONE_LEADER_REVIEW"
  }
}
```

### `GET /api/v1/kaizens/:id/assign-owner`
→ See Plant OPEX endpoints below (section 7).

---

## 7. Plant OPEX Endpoints

### `POST /api/v1/ideas/:id/assign-owner`
**Permission:** `CAN_ASSIGN_IMPL_OWNER`

**Request:**
```json
{
  "implementation_owner_id": "uuid"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "idea_id": "uuid",
    "implementation_owner": { "id": "uuid", "full_name": "string" }
  }
}
```

### `GET /api/v1/plant-opex/dashboard`
**Permission:** `CAN_MANAGE_MASTER_DATA`

Returns counts by tab: Submitted, Approved, In-Progress, Kaizen (One Pager uploaded), Approved (kaizens), R&R eligible.

---

## 8. Rewards & Recognition Endpoints

### `POST /api/v1/rewards/regular`
**Permission:** `CAN_ASSIGN_REWARD`

**Request:**
```json
{
  "kaizen_id": "uuid",
  "reward_type": "REGULAR",
  "reward_amount": 5000.00,
  "reward_details": "string"
}
```

### `POST /api/v1/rewards/nominate-high-impact`
**Permission:** `CAN_NOMINATE_HIGH_IMPACT`

**Request:**
```json
{
  "kaizen_id": "uuid",
  "sc_member_ids": ["uuid", "uuid", "uuid"]
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "nomination_id": "uuid",
    "kaizen_id": "uuid",
    "sc_members_assigned": 3,
    "nomination_status": "PENDING_RATINGS"
  }
}
```

### `POST /api/v1/rewards/sc-rating`
**Permission:** `CAN_RATE_HIGH_IMPACT` + must be assigned SC member

**Request:**
```json
{
  "nomination_id": "uuid",
  "rating_score": 8.5,
  "rating_notes": "string"
}
```

### `GET /api/v1/rewards/nominations/:nomination_id/ratings-status`
**Permission:** `CAN_NOMINATE_HIGH_IMPACT`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "nomination_id": "uuid",
    "total_members": 3,
    "ratings_submitted": 2,
    "all_complete": false,
    "gate_unlocked": false
  }
}
```

### `POST /api/v1/rewards/nominate-special`
**Permission:** `CAN_NOMINATE_SPECIAL_RR` + gate: all SC ratings complete

**Request:**
```json
{
  "nomination_id": "uuid",
  "reward_details": "string"
}
```

### `POST /api/v1/rewards/nominate-inter-plant`
**Permission:** `CAN_NOMINATE_INTER_PLANT` + gate: all SC ratings complete

**Request:**
```json
{
  "nomination_id": "uuid",
  "competition_year": 2024,
  "competition_round": "PLANT"
}
```

---

## 9. Master Data Endpoints

### `GET /api/v1/master/categories`
**Permission:** Authenticated

### `POST /api/v1/master/categories`
**Permission:** `CAN_MANAGE_MASTER_DATA`

**Request:**
```json
{
  "name": "string",
  "code": "string"
}
```

### `PUT /api/v1/master/categories/:id`
**Permission:** `CAN_MANAGE_MASTER_DATA`

### `DELETE /api/v1/master/categories/:id`
**Permission:** `CAN_MANAGE_MASTER_DATA`  
Soft delete: sets `is_active = false`.

Same pattern applies for: `/master/sub-categories`, `/master/tags`, `/master/sla-configs`

### `GET /api/v1/master/org/plants`
**Permission:** Authenticated

### `GET /api/v1/master/org/plants/:plant_id/zones`
**Permission:** Authenticated

### `GET /api/v1/master/org/zones/:zone_id/departments`
**Permission:** Authenticated

### `GET /api/v1/master/org/departments/:dept_id/functions`
**Permission:** Authenticated

### `GET /api/v1/master/org/functions/:func_id/halls`
**Permission:** Authenticated

### `GET /api/v1/master/org/halls/:hall_id/locations`
**Permission:** Authenticated

---

## 10. User Management Endpoints

### `GET /api/v1/users`
**Permission:** `CAN_MANAGE_USERS`

### `POST /api/v1/users`
**Permission:** `CAN_MANAGE_USERS`

**Request:**
```json
{
  "employee_id": "EMP001",
  "email": "user@acg.com",
  "full_name": "string",
  "phone": "string",
  "plant_id": "uuid",
  "role_id": "uuid"
}
```

### `PUT /api/v1/users/:id`
**Permission:** `CAN_MANAGE_USERS`

### `PUT /api/v1/users/:id/deactivate`
**Permission:** `CAN_MANAGE_USERS`

### `POST /api/v1/users/:id/roles`
**Permission:** `CAN_MANAGE_USERS`

**Request:**
```json
{
  "role_id": "uuid",
  "plant_id": "uuid"
}
```

### `DELETE /api/v1/users/:id/roles/:role_id`
**Permission:** `CAN_MANAGE_USERS`

### `GET /api/v1/roles`
**Permission:** `CAN_MANAGE_USERS`

### `GET /api/v1/permissions`
**Permission:** `CAN_MANAGE_SYSTEM`

---

## 11. Notifications Endpoints

### `GET /api/v1/notifications`
**Permission:** Authenticated (own only)

**Query params:**
```
is_read=true|false
page=1&page_size=20
```

### `PUT /api/v1/notifications/:id/read`
**Permission:** Authenticated (own only)

### `PUT /api/v1/notifications/read-all`
**Permission:** Authenticated (marks all own notifications read)

---

## 12. Reporting Endpoints (Phase 8 — defined here for contract completeness)

### `GET /api/v1/reports/summary`
**Permission:** `CAN_VIEW_REPORTS`

Returns aggregate counts: total ideas submitted, approved, rejected, in-progress; kaizens completed; R&R distributed. Filterable by plant_id, date range.

### `GET /api/v1/reports/sla-breaches`
**Permission:** `CAN_VIEW_REPORTS`

Returns workflow steps where `sla_due_at < now()` and `status = PENDING`.

---

## 13. SLA Background Job — Not an API Endpoint

The SLA engine is a **cron job**, not an HTTP endpoint. It runs on a configurable interval (default: every 15 minutes).

```
Cron job reads:
  SELECT ws.*
  FROM workflow_steps ws
  WHERE ws.status = 'PENDING'
    AND ws.sla_due_at IS NOT NULL
    AND ws.sla_due_at <= NOW()
    AND ws.escalated = FALSE

For each overdue step:
  1. Create notification (type: SLA_ESCALATED) for escalation target
  2. Set ws.escalated = TRUE
  3. Write audit_log (action: SLA_ESCALATED)
  4. Trigger email adapter (mock / MailHog / SMTP)
```

---

*Document end. Next: System Architecture Diagram.*
