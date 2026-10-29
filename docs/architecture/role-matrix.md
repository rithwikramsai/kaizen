# KIET — Role Matrix
## Phase 0 · Architecture Foundation

**Document version:** 1.0  
**Branch:** `feature/architecture-foundation`  
**BRD reference:** Sections 4, 8, 11  
**Status:** Authoritative — RBAC seed data and middleware rules derive from this document

---

## 1. Foundational RBAC Rules

1. **Permission-based enforcement** — middleware checks `permissions.code`, never `roles.name`
2. **Role is a convenience grouping** — a role is a named bundle of permissions, not a security primitive
3. **One user, one role per plant** — `user_roles` has a `(user_id, role_id, plant_id)` unique key
4. **A user can hold one role** per plant (e.g., same person is Zone Leader at Plant A, HOD at Plant B — rare but supported)
5. **Permission codes are the contract** between the API layer and the engine — never add role checks in controllers

---

## 2. User Roles (BRD §4)

| Role ID (seed) | Role Name | Role Code | Description |
|---|---|---|---|
| R01 | Plant Associate | `plant_associate` | Frontline employee — submits ideas, implements kaizens |
| R02 | Management Associate | `management_associate` | Staff/management layer — submits ideas on behalf of team |
| R03 | Zone Leader | `zone_leader` | First-level reviewer for ideas and One Pagers in their zone |
| R04 | HOD | `hod` | Head of Department — second-level reviewer, sets dynamic flags |
| R05 | Plant OPEX | `plant_opex` | Operations Excellence — manages master data, assigns implementation owners, drives R&R |
| R06 | Plant Safety | `plant_safety` | Safety reviewer — reviews ideas/One Pagers when HOD sets safety flag |
| R07 | Plant Quality / QMS | `plant_quality` | Quality reviewer — reviews ideas/One Pagers when HOD sets QMS flag |
| R08 | SME | `sme` | Subject Matter Expert — reviews One Pagers when machine design change flag is set |
| R09 | Steering Committee Member | `sc_member` | Rates High Impact nominations |
| R10 | System Admin | `system_admin` | Full system access — manages users, master data, configuration |

---

## 3. Permission Codes

| Permission Code | Description |
|---|---|
| `CAN_SUBMIT_IDEA` | Submit an idea (anonymous or named) |
| `CAN_VIEW_OWN_IDEAS` | View ideas submitted by self |
| `CAN_VIEW_ZONE_IDEAS` | View all ideas in own zone |
| `CAN_VIEW_PLANT_IDEAS` | View all ideas in own plant |
| `CAN_VIEW_ALL_IDEAS` | View ideas across all plants |
| `CAN_APPROVE_IDEA` | Approve / return / reject at ZONE_LEADER or HOD review step |
| `CAN_REVIEW_SAFETY` | Approve / return / reject at SAFETY_REVIEW step |
| `CAN_REVIEW_QUALITY` | Approve / return / reject at QUALITY_REVIEW step |
| `CAN_REVIEW_IMPLEMENTATION` | Approve / return / reject at Zone Leader / HOD review in IMPLEMENTATION_APPROVAL |
| `CAN_REVIEW_SME` | Approve / return / reject at SME_REVIEW step |
| `CAN_UPLOAD_SCI_TECH` | Upload Sci-Tech documents at SCI_TECH_UPLOAD step |
| `CAN_MARK_IMPLEMENTED` | Mark idea as implemented (triggers One Pager creation) |
| `CAN_SUBMIT_ONE_PAGER` | Submit One Pager (initiates IMPLEMENTATION_APPROVAL workflow) |
| `CAN_ASSIGN_IMPL_OWNER` | Assign implementation owner to an approved idea |
| `CAN_RATE_HIGH_IMPACT` | Submit SC rating for a High Impact nomination |
| `CAN_ASSIGN_REWARD` | Assign Regular R&R reward to an approved kaizen |
| `CAN_NOMINATE_HIGH_IMPACT` | Nominate an approved kaizen as High Impact |
| `CAN_NOMINATE_SPECIAL_RR` | Nominate a rated kaizen for Special R&R |
| `CAN_NOMINATE_INTER_PLANT` | Nominate a kaizen for Inter-Plant competition |
| `CAN_MANAGE_USERS` | Create, update, deactivate user accounts; assign roles |
| `CAN_MANAGE_MASTER_DATA` | Create/update/deactivate categories, zones, departments, SLA configs, etc. |
| `CAN_VIEW_REPORTS` | Access analytics and reports dashboards |
| `CAN_MANAGE_SYSTEM` | Full system administration (includes all above) |

---

## 4. Role → Permission Matrix

`✓` = permission granted by default for this role  
`—` = not granted

| Permission | Plant Associate | Mgmt Associate | Zone Leader | HOD | Plant OPEX | Plant Safety | Plant Quality | SME | SC Member | System Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `CAN_SUBMIT_IDEA` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `CAN_VIEW_OWN_IDEAS` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `CAN_VIEW_ZONE_IDEAS` | — | — | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| `CAN_VIEW_PLANT_IDEAS` | — | — | — | ✓ | ✓ | — | — | — | — | ✓ |
| `CAN_VIEW_ALL_IDEAS` | — | — | — | — | — | — | — | — | — | ✓ |
| `CAN_APPROVE_IDEA` | — | — | ✓ | ✓ | — | — | — | — | — | ✓ |
| `CAN_REVIEW_SAFETY` | — | — | — | — | — | ✓ | — | — | — | ✓ |
| `CAN_REVIEW_QUALITY` | — | — | — | — | — | — | ✓ | — | — | ✓ |
| `CAN_REVIEW_IMPLEMENTATION` | — | — | ✓ | ✓ | — | — | — | — | — | ✓ |
| `CAN_REVIEW_SME` | — | — | — | — | — | — | — | ✓ | — | ✓ |
| `CAN_UPLOAD_SCI_TECH` | — | — | — | ✓ | — | — | — | — | — | ✓ |
| `CAN_MARK_IMPLEMENTED` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| `CAN_SUBMIT_ONE_PAGER` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| `CAN_ASSIGN_IMPL_OWNER` | — | — | — | — | ✓ | — | — | — | — | ✓ |
| `CAN_RATE_HIGH_IMPACT` | — | — | — | — | — | — | — | — | ✓ | ✓ |
| `CAN_ASSIGN_REWARD` | — | — | — | — | ✓ | — | — | — | — | ✓ |
| `CAN_NOMINATE_HIGH_IMPACT` | — | — | — | — | ✓ | — | — | — | — | ✓ |
| `CAN_NOMINATE_SPECIAL_RR` | — | — | — | — | ✓ | — | — | — | — | ✓ |
| `CAN_NOMINATE_INTER_PLANT` | — | — | — | — | ✓ | — | — | — | — | ✓ |
| `CAN_MANAGE_USERS` | — | — | — | — | — | — | — | — | — | ✓ |
| `CAN_MANAGE_MASTER_DATA` | — | — | — | — | ✓ | — | — | — | — | ✓ |
| `CAN_VIEW_REPORTS` | — | — | — | — | ✓ | — | — | — | — | ✓ |
| `CAN_MANAGE_SYSTEM` | — | — | — | — | — | — | — | — | — | ✓ |

---

## 5. Workflow Step → Required Permission

The workflow engine enforces permission checks before processing any step action.

| Workflow Type | Stage Code | Action | Required Permission |
|---|---|---|---|
| IDEA_APPROVAL | `ZONE_LEADER_REVIEW` | APPROVE / RETURN / REJECT | `CAN_APPROVE_IDEA` |
| IDEA_APPROVAL | `HOD_REVIEW` | APPROVE / RETURN / REJECT | `CAN_APPROVE_IDEA` |
| IDEA_APPROVAL | `SAFETY_REVIEW` | APPROVE / RETURN / REJECT | `CAN_REVIEW_SAFETY` |
| IDEA_APPROVAL | `QUALITY_REVIEW` | APPROVE / RETURN / REJECT | `CAN_REVIEW_QUALITY` |
| IMPLEMENTATION_APPROVAL | `ZONE_LEADER_REVIEW` | APPROVE / RETURN / REJECT | `CAN_REVIEW_IMPLEMENTATION` |
| IMPLEMENTATION_APPROVAL | `HOD_REVIEW` | APPROVE / RETURN / REJECT | `CAN_REVIEW_IMPLEMENTATION` |
| IMPLEMENTATION_APPROVAL | `SME_REVIEW` | APPROVE / RETURN / REJECT | `CAN_REVIEW_SME` |
| IMPLEMENTATION_APPROVAL | `SAFETY_REVIEW` | APPROVE / RETURN / REJECT | `CAN_REVIEW_SAFETY` |
| IMPLEMENTATION_APPROVAL | `QUALITY_REVIEW` | APPROVE / RETURN / REJECT | `CAN_REVIEW_QUALITY` |
| IMPLEMENTATION_APPROVAL | `SCI_TECH_UPLOAD` | SUBMIT | `CAN_UPLOAD_SCI_TECH` |

**Additional rule:** Beyond having the permission, the user must also be the `workflow_steps.assigned_user_id` for that step. Both checks must pass.

---

## 6. Feature → Role Access Summary

### 6.1 Idea Management

| Feature | Who Can |
|---|---|
| Submit anonymous idea | Any authenticated user |
| Submit named idea | Any authenticated user |
| View own submitted ideas | All roles |
| View all ideas in zone | Zone Leader, HOD, Plant OPEX, System Admin |
| View all ideas in plant | HOD, Plant OPEX, System Admin |
| Edit idea (before submission) | Submitter only |
| Rework returned idea | Submitter only (on notification link) |

### 6.2 Approval Workflow

| Feature | Who Can |
|---|---|
| Review / approve idea at Zone Leader step | Zone Leader, HOD (see submission variants), System Admin |
| Review / approve idea at HOD step | HOD, System Admin |
| Set dynamic flags on idea | HOD only (during HOD_REVIEW action) |
| Review safety | Plant Safety, System Admin |
| Review quality | Plant Quality, System Admin |

### 6.3 Implementation Management

| Feature | Who Can |
|---|---|
| View approved ideas (Approved tab) | Plant Associate (own ideas), Plant OPEX, Zone Leader, HOD |
| Assign implementation owner | Plant OPEX, System Admin |
| Mark idea as implemented | Implementation Owner (Idea Owner or Zone Leader, as assigned) |
| Create / edit One Pager (draft) | Implementation Owner |
| Submit One Pager | Implementation Owner |
| Review One Pager at Zone Leader step | Zone Leader, System Admin |
| Review One Pager at HOD step | HOD, System Admin |
| Review One Pager at SME step | SME, System Admin |
| Upload Sci-Tech documents | HOD (assigned at SCI_TECH_UPLOAD step), System Admin |

### 6.4 Rewards & Recognition

| Feature | Who Can |
|---|---|
| View approved kaizens tab | Plant OPEX, System Admin |
| Assign Regular Reward | Plant OPEX, System Admin |
| Nominate as High Impact | Plant OPEX, System Admin |
| Assign SC members for rating | Plant OPEX, System Admin |
| Submit SC rating | SC Member (only if assigned), System Admin |
| Nominate for Special R&R | Plant OPEX (after all SC ratings complete), System Admin |
| Nominate for Inter-Plant competition | Plant OPEX (after all SC ratings complete), System Admin |

### 6.5 Administration

| Feature | Who Can |
|---|---|
| Create / manage users | System Admin |
| Assign / revoke roles | System Admin |
| Manage categories / sub-categories | Plant OPEX, System Admin |
| Manage zones / departments / functions | System Admin |
| Manage SLA configurations | System Admin |
| View analytics / reports | Plant OPEX, System Admin |
| Full system access | System Admin |

---

## 7. RBAC Middleware Implementation Contract

```typescript
// middleware/requirePermission.ts
// Usage: router.post('/ideas', requirePermission('CAN_SUBMIT_IDEA'), controller)
// Throws 403 if user lacks permission.

// middleware/requireStepAssignment.ts
// Usage: applied within workflow action handlers
// Checks: req.user.id === workflow_step.assigned_user_id
// Throws 403 if user is not the assigned step approver.

// NEVER do this in a controller:
//   if (req.user.role === 'hod') { ... }   ← BANNED

// ALWAYS do this:
//   await requirePermission('CAN_APPROVE_IDEA')(req, res, next)
```

---

## 8. Seed Data (for database migrations)

```sql
-- Roles
INSERT INTO roles (id, name, description) VALUES
  (gen_random_uuid(), 'Plant Associate',      'Frontline employee'),
  (gen_random_uuid(), 'Management Associate', 'Management-layer employee'),
  (gen_random_uuid(), 'Zone Leader',          'Zone-level first reviewer'),
  (gen_random_uuid(), 'HOD',                  'Head of Department'),
  (gen_random_uuid(), 'Plant OPEX',           'Operations Excellence coordinator'),
  (gen_random_uuid(), 'Plant Safety',         'Safety reviewer'),
  (gen_random_uuid(), 'Plant Quality',        'Quality / QMS reviewer'),
  (gen_random_uuid(), 'SME',                  'Subject Matter Expert'),
  (gen_random_uuid(), 'Steering Committee Member', 'SC member for High Impact ratings'),
  (gen_random_uuid(), 'System Admin',         'Full system administrator');

-- Permissions
INSERT INTO permissions (id, code, description) VALUES
  (gen_random_uuid(), 'CAN_SUBMIT_IDEA',            'Submit an idea'),
  (gen_random_uuid(), 'CAN_VIEW_OWN_IDEAS',          'View own submitted ideas'),
  (gen_random_uuid(), 'CAN_VIEW_ZONE_IDEAS',         'View all ideas in own zone'),
  (gen_random_uuid(), 'CAN_VIEW_PLANT_IDEAS',        'View all ideas in own plant'),
  (gen_random_uuid(), 'CAN_VIEW_ALL_IDEAS',          'View ideas across all plants'),
  (gen_random_uuid(), 'CAN_APPROVE_IDEA',            'Approve/return/reject at idea review steps'),
  (gen_random_uuid(), 'CAN_REVIEW_SAFETY',           'Approve/return/reject at safety review step'),
  (gen_random_uuid(), 'CAN_REVIEW_QUALITY',          'Approve/return/reject at quality review step'),
  (gen_random_uuid(), 'CAN_REVIEW_IMPLEMENTATION',   'Approve/return/reject at impl review steps'),
  (gen_random_uuid(), 'CAN_REVIEW_SME',              'Approve/return/reject at SME review step'),
  (gen_random_uuid(), 'CAN_UPLOAD_SCI_TECH',         'Upload Sci-Tech documents'),
  (gen_random_uuid(), 'CAN_MARK_IMPLEMENTED',        'Mark idea as implemented'),
  (gen_random_uuid(), 'CAN_SUBMIT_ONE_PAGER',        'Submit One Pager'),
  (gen_random_uuid(), 'CAN_ASSIGN_IMPL_OWNER',       'Assign implementation owner'),
  (gen_random_uuid(), 'CAN_RATE_HIGH_IMPACT',        'Submit SC rating'),
  (gen_random_uuid(), 'CAN_ASSIGN_REWARD',           'Assign reward to kaizen'),
  (gen_random_uuid(), 'CAN_NOMINATE_HIGH_IMPACT',    'Nominate as High Impact'),
  (gen_random_uuid(), 'CAN_NOMINATE_SPECIAL_RR',     'Nominate for Special R&R'),
  (gen_random_uuid(), 'CAN_NOMINATE_INTER_PLANT',    'Nominate for Inter-Plant competition'),
  (gen_random_uuid(), 'CAN_MANAGE_USERS',            'Create/update/deactivate users'),
  (gen_random_uuid(), 'CAN_MANAGE_MASTER_DATA',      'Manage master data'),
  (gen_random_uuid(), 'CAN_VIEW_REPORTS',            'View analytics and reports'),
  (gen_random_uuid(), 'CAN_MANAGE_SYSTEM',           'Full system administration');
```

*Full `role_permissions` seed rows are generated from Section 4 matrix during Phase 1 migration scripting.*

---

*Document end. Next: API Contract → System Architecture.*
