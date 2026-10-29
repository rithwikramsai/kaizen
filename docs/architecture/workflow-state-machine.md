# KIET — Workflow State Machine
## Phase 0 · Architecture Foundation

**Document version:** 1.0  
**Branch:** `feature/architecture-foundation`  
**BRD reference:** Sections 9, 10.2, 10.3, 10.4, 13.1–13.4  
**Status:** Authoritative — do not implement without this document

---

## 1. Foundational Principles

### 1.1 One Engine, Two Workflows

The KIET platform has **one reusable workflow engine** that drives two distinct business workflows:

| Workflow Type | Entity | Trigger | Terminal Outcome |
|---|---|---|---|
| `IDEA_APPROVAL` | `ideas` | Idea submitted | `IDEA_APPROVED` or `IDEA_REJECTED` |
| `IMPLEMENTATION_APPROVAL` | `kaizens` | One Pager submitted | `KAIZEN_APPROVED` or `KAIZEN_REJECTED` |

The engine does not know business logic. It knows:
- Ordered steps from a template
- Which user is assigned to each step
- What action was taken (APPROVED / RETURNED / REJECTED)
- How to route based on that action
- When SLA timers fire

### 1.2 Runtime Step Generation

Workflows are **never hardcoded**. On each workflow initiation:

1. Load the correct `workflow_template` (IDEA_APPROVAL or IMPLEMENTATION_APPROVAL)
2. Read base steps from `workflow_template_steps`
3. Generate `workflow_instance` + base `workflow_steps` rows
4. Dynamic steps are **inserted** into `workflow_steps` at runtime when flags are set

### 1.3 Status Source of Truth

```
workflow_instance.current_stage   ← WHERE in the workflow
workflow_instance.current_status  ← WHAT is happening at that stage
```

Business entity tables (`ideas`, `kaizens`) carry **minimal lifecycle markers** only.  
Never duplicate fine-grained step status in business tables.

---

## 2. Shared State Vocabulary

### 2.1 Workflow Instance Statuses (`workflow_instance.current_status`)

| Status | Meaning |
|---|---|
| `PENDING` | Awaiting action from current assignee |
| `IN_PROGRESS` | Action started (used for Sci-Tech upload, draft One Pager) |
| `APPROVED` | Current step approved, moving to next |
| `RETURNED` | Current step returned to previous assignee |
| `REJECTED` | Terminal — workflow permanently stopped |
| `COMPLETED` | All steps passed — workflow done |

### 2.2 Workflow Instance Stages (`workflow_instance.current_stage`)

**IDEA_APPROVAL stages:**

```
ZONE_LEADER_REVIEW
HOD_REVIEW
SAFETY_REVIEW          ← inserted if safety_review_required = true
QUALITY_REVIEW         ← inserted if qms_review_required = true
IDEA_APPROVED          ← terminal success
IDEA_REJECTED          ← terminal failure
```

**IMPLEMENTATION_APPROVAL stages:**

```
ZONE_LEADER_REVIEW
HOD_REVIEW
SME_REVIEW             ← inserted if machine_design_change = true (inherited)
SAFETY_REVIEW          ← inserted if safety_review_required = true (inherited)
QUALITY_REVIEW         ← inserted if qms_review_required = true (inherited)
SCI_TECH_UPLOAD        ← inserted if sci_tech_required = true (set by SME)
KAIZEN_APPROVED        ← terminal success
KAIZEN_REJECTED        ← terminal failure
```

### 2.3 Workflow Step Statuses (per `workflow_steps` row)

| Status | Meaning |
|---|---|
| `PENDING` | Assigned, awaiting action |
| `APPROVED` | This approver approved |
| `RETURNED` | This approver returned it (triggers step N-1 re-activation) |
| `REJECTED` | This approver rejected — propagates REJECTED to workflow_instance |
| `SKIPPED` | Flag was false — step was not needed |

---

## 3. Macro Kaizen Lifecycle

This is the **end-to-end lifecycle** across both workflows and the implementation phase between them.

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      KAIZEN MACRO LIFECYCLE                             ║
╚══════════════════════════════════════════════════════════════════════════╝

  [Idea Owner / Mgmt Associate]
            │
            │  Submit Idea (anonymous or authenticated)
            ▼
    ┌───────────────┐
    │  IDEA_DRAFT   │  ← idea saved but not submitted (optional)
    └───────┬───────┘
            │  Submit
            ▼
    ┌───────────────────┐
    │  IDEA_SUBMITTED   │  ← Registration ID generated
    └─────────┬─────────┘
              │  Auto-route to Zone Leader
              ▼
    ╔═════════════════════════════╗
    ║   IDEA_APPROVAL WORKFLOW    ║  ← workflow_instance type: IDEA_APPROVAL
    ║   (see Section 4)           ║
    ╚══════════════╤══════════════╝
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
  ┌─────────────┐     ┌──────────────┐
  │IDEA_APPROVED│     │IDEA_REJECTED │ ← Terminal. Notify Idea Owner.
  └──────┬──────┘     └──────────────┘
         │
         │  Assign implementation owner
         │  (Management Associate → Idea Owner)
         │  (Plant Associate → Zone Leader)
         ▼
  ┌────────────────────────┐
  │ IMPLEMENTATION_PENDING │  ← Awaiting "Mark as Implemented"
  └───────────┬────────────┘
              │  Implementation Owner marks Implemented
              ▼
  ┌──────────────────────────────┐
  │ IMPLEMENTATION_IN_PROGRESS   │
  └──────────────┬───────────────┘
                 │  Open One Pager form
                 ▼
  ┌──────────────────────────┐
  │ DOCUMENTATION_PENDING    │  ← Kaizen ID generated here
  │ (One Pager draft active) │
  └────────────┬─────────────┘
               │  Submit One Pager
               ▼
  ┌──────────────────────────────┐
  │ ONE_PAGER_SUBMITTED          │
  └──────────────┬───────────────┘
                 │  Auto-route to Zone Leader
                 ▼
  ╔═══════════════════════════════════════╗
  ║   IMPLEMENTATION_APPROVAL WORKFLOW    ║  ← workflow_instance type: IMPLEMENTATION_APPROVAL
  ║   (see Section 5)                     ║
  ╚══════════════════════╤════════════════╝
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
  ┌─────────────────┐      ┌─────────────────┐
  │ KAIZEN_APPROVED │      │ KAIZEN_REJECTED  │ ← Terminal. Notify Idea Owner.
  └────────┬────────┘      └─────────────────┘
           │
           │  Auto-move to Plant OPEX Approved tab
           ▼
  ┌──────────────────┐
  │   RR_ELIGIBLE    │  ← Plant OPEX can assign Regular R&R
  └────────┬─────────┘
           │
           │  May also move to:
           │  ┌─────────────────────────────────────────────┐
           │  │ KAIZEN_RR (selected for R&R)                │
           │  │ HIGH_IMPACT (nominated as High Impact)      │
           │  │ SPECIAL_RR (after SC ratings complete)      │
           │  │ INTER_PLANT_COMPETITION (nominated for IPKC)│
           │  └─────────────────────────────────────────────┘
           │  (A Kaizen can be in MULTIPLE reward tabs simultaneously)
           ▼
  ┌──────────────┐
  │    CLOSED    │  ← Terminal success.
  └──────────────┘
```

---

## 4. IDEA_APPROVAL Workflow — Full State Machine

### 4.1 Base Template Steps (always generated)

```
step_order │ stage_code           │ assigned_role        │ can_insert_flags
───────────┼──────────────────────┼──────────────────────┼─────────────────
    1      │ ZONE_LEADER_REVIEW   │ zone_leader          │ No
    2      │ HOD_REVIEW           │ hod                  │ Yes ← safety / qms / design flags
```

### 4.2 Dynamic Steps (inserted after HOD_REVIEW if HOD sets flags)

```
HOD Flag Set                   → Step Inserted           │ assigned_role
───────────────────────────────────────────────────────────────────────────
safety_review_required = true  → SAFETY_REVIEW (order 3) │ plant_safety
qms_review_required    = true  → QUALITY_REVIEW (order 4)│ plant_quality

Both flags true                → SAFETY_REVIEW (order 3) │ plant_safety
                                  QUALITY_REVIEW (order 4)│ plant_quality

machine_design_change  = true  → NO step in IDEA_APPROVAL │ (flag stored only)
                                  SME_REVIEW inserted in   │
                                  IMPLEMENTATION_APPROVAL  │
```

### 4.3 IDEA_APPROVAL State Diagram

```
                    ┌─────────────────────────────┐
                    │       IDEA_SUBMITTED         │
                    │  (workflow instance created) │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    ZONE_LEADER_REVIEW         │
                    │    status: PENDING           │
                    └──────┬───────────┬───────────┘
                           │           │           │
                        APPROVE      RETURN      REJECT
                           │           │           │
                           │    ┌──────▼──────┐    │
                           │    │ Idea Owner  │    │
                           │    │ notified +  │    │
                           │    │ rework link │    │
                           │    └──────┬──────┘    │
                           │           │            │
                           │      Re-submit         │
                           │           │            │
                    ┌──────▼──────────▼──┐          │
                    │    HOD_REVIEW       │          │
                    │    status: PENDING  │          │
                    └──┬───────┬──────┬──┘          │
                       │       │      │              │
                    APPROVE  RETURN  REJECT          │
                    + set     │      │               │
                    flags     │      │               │
                       │   ┌──▼────────────────────────────────┐
                       │   │ Return routes to ZONE_LEADER_REVIEW│
                       │   │ (previous active step, step N-1)  │
                       │   └──────────────────────────────────┘
                       │                             │
              ┌────────▼─────────────────────────────────────────────┐
              │              FLAG EVALUATION                          │
              │  (workflow engine reads workflow_flags after HOD step)│
              └────────┬─────────────────────────────────────────────┘
                        │
           ┌────────────┼────────────────────────────────────────┐
           │            │                                         │
    safety=F,qms=F  safety=T                               qms=T (only)
           │            │                                         │
           ▼            ▼                                         ▼
    ┌────────────┐ ┌──────────────┐                    ┌─────────────────┐
    │    IDEA    │ │SAFETY_REVIEW │                    │ QUALITY_REVIEW  │
    │  APPROVED  │ │   PENDING    │                    │    PENDING      │
    └────────────┘ └──────┬───────┘                    └───────┬─────────┘
                          │                                     │
                       APPROVE ────────────────────────── APPROVE
                          │     (if qms=T, insert QUALITY      │
                          │      after SAFETY)                  │
                          ▼                                     ▼
                   ┌──────────────┐                    ┌─────────────────┐
               [if qms=T]         │                    │   IDEA_APPROVED │
               QUALITY_REVIEW     │                    └─────────────────┘
                  PENDING         │
                   └─────────┬────┘
                             │
                          APPROVE
                             │
                             ▼
                    ┌────────────────┐
                    │  IDEA_APPROVED │  ← workflow_instance.current_status = COMPLETED
                    └────────────────┘       Notify: Idea Owner, Plant OPEX


RETURN from SAFETY_REVIEW  → routes back to HOD_REVIEW (step N-1)
RETURN from QUALITY_REVIEW → routes back to SAFETY_REVIEW if present,
                              else HOD_REVIEW

REJECT from any step       → workflow_instance.current_status = REJECTED
                              idea.status = REJECTED
                              Notify: Idea Owner with comments
```

### 4.4 IDEA_APPROVAL Transition Table

| From Stage | Action | Condition | To Stage | Notified |
|---|---|---|---|---|
| — | Submit | — | `ZONE_LEADER_REVIEW` | Zone Leader, Plant OPEX |
| `ZONE_LEADER_REVIEW` | APPROVE | — | `HOD_REVIEW` | HOD |
| `ZONE_LEADER_REVIEW` | RETURN | comment required | `IDEA_OWNER` (rework) | Idea Owner |
| `ZONE_LEADER_REVIEW` | REJECT | comment required | `IDEA_REJECTED` (terminal) | Idea Owner |
| `HOD_REVIEW` | APPROVE | no flags | `IDEA_APPROVED` (terminal) | Idea Owner, Plant OPEX |
| `HOD_REVIEW` | APPROVE | safety=T, qms=F | Insert + go to `SAFETY_REVIEW` | Plant Safety |
| `HOD_REVIEW` | APPROVE | safety=F, qms=T | Insert + go to `QUALITY_REVIEW` | Plant Quality |
| `HOD_REVIEW` | APPROVE | safety=T, qms=T | Insert both, go to `SAFETY_REVIEW` | Plant Safety |
| `HOD_REVIEW` | RETURN | comment required | `ZONE_LEADER_REVIEW` (prev step) | Zone Leader |
| `HOD_REVIEW` | REJECT | comment required | `IDEA_REJECTED` (terminal) | Idea Owner |
| `SAFETY_REVIEW` | APPROVE | qms=F | `IDEA_APPROVED` (terminal) | Idea Owner, Plant OPEX |
| `SAFETY_REVIEW` | APPROVE | qms=T | `QUALITY_REVIEW` | Plant Quality |
| `SAFETY_REVIEW` | RETURN | comment required | `HOD_REVIEW` (prev step) | HOD |
| `QUALITY_REVIEW` | APPROVE | — | `IDEA_APPROVED` (terminal) | Idea Owner, Plant OPEX |
| `QUALITY_REVIEW` | RETURN | comment required | Previous active step | Previous assignee |

### 4.5 Submission Variant Rules (BRD §13.2)

| Submitter Role | Zone Leader Step Behavior | HOD Step Behavior |
|---|---|---|
| Plant Associate | ZONE_LEADER_REVIEW → normal, routed to Zone Leader of that zone | HOD_REVIEW → normal |
| Management Associate | ZONE_LEADER_REVIEW → normal | HOD_REVIEW → normal |
| Zone Leader (within same function) | ZONE_LEADER_REVIEW → **auto-approved / skipped** (submitter IS Zone Leader) | HOD_REVIEW → normal |
| Zone Leader (cross-functional) | ZONE_LEADER_REVIEW → routed to other function's Zone Leader | HOD_REVIEW → normal |
| HOD (within same function) | ZONE_LEADER_REVIEW → normal | HOD_REVIEW → **auto-approved / skipped** |
| HOD (cross-functional) | ZONE_LEADER_REVIEW → normal | HOD_REVIEW → normal, then routes to Function Head |

**Engine rule:** When the assigned user for a step IS the submitter, mark that step SKIPPED and advance to next step automatically.

---

## 5. IMPLEMENTATION_APPROVAL Workflow — Full State Machine

### 5.1 Base Template Steps (always generated)

```
step_order │ stage_code           │ assigned_role        │ flag source
───────────┼──────────────────────┼──────────────────────┼────────────────────────
    1      │ ZONE_LEADER_REVIEW   │ zone_leader          │ —
    2      │ HOD_REVIEW           │ hod                  │ —
```

### 5.2 Dynamic Steps (inserted based on flags inherited from IDEA_APPROVAL + SME flag)

```
Flag Source          │ Flag                       │ Step Inserted               │ order │ Role
─────────────────────┼────────────────────────────┼─────────────────────────────┼───────┼─────────────
Idea Approval (HOD)  │ machine_design_change=true  │ SME_REVIEW                  │  3    │ sme
Idea Approval (HOD)  │ safety_review_required=true │ SAFETY_REVIEW               │  4    │ plant_safety
Idea Approval (HOD)  │ qms_review_required=true    │ QUALITY_REVIEW              │  5    │ plant_quality
SME (during step 3)  │ sci_tech_required=true      │ SCI_TECH_UPLOAD (HOD task)  │  6    │ hod
```

**Flag inheritance rule:** On IMPLEMENTATION_APPROVAL workflow creation, read `workflow_flags` from the corresponding IDEA_APPROVAL `workflow_instance` and copy flags to the new implementation `workflow_flags` row.

**SCI_TECH_UPLOAD insertion rule:** This step is inserted **during** SME_REVIEW execution (when SME approves and sets sci_tech_required=true). It is inserted after QUALITY_REVIEW (last step before terminal). It is a HOD task — upload documents, then submit.

### 5.3 IMPLEMENTATION_APPROVAL State Diagram

```
                 ┌────────────────────────────┐
                 │     ONE_PAGER_SUBMITTED      │
                 │ (workflow instance created)  │
                 │ Flags inherited from         │
                 │ IDEA_APPROVAL workflow_flags │
                 └──────────────┬─────────────┘
                                │
                 ┌──────────────▼──────────────┐
                 │    ZONE_LEADER_REVIEW         │
                 │    status: PENDING           │
                 └─────┬──────────┬─────────────┘
                       │          │          │
                    APPROVE     RETURN     REJECT
                       │          │          │
                       │   ┌──────▼──────┐   │
                       │   │ Impl Owner  │   │
                       │   │ rework One  │   │
                       │   │ Pager       │   │
                       │   └──────┬──────┘   │
                       │          │           │
                       │     Re-submit         │
                       │                       │
                 ┌─────▼──────────────┐        │
                 │    HOD_REVIEW       │        │
                 │    status: PENDING  │        │
                 └──┬───────┬──────┬──┘        │
                    │       │      │             │
                 APPROVE  RETURN  REJECT         │
                    │       │      │             │
                    │   ┌───▼──────────────────────────────────┐
                    │   │ Return → ZONE_LEADER_REVIEW (prev)   │
                    │   └──────────────────────────────────────┘
                    │
         ┌──────────▼────────────────────────────────────────────────────────┐
         │                   FLAG EVALUATION                                  │
         │  (engine reads inherited workflow_flags for this impl workflow)    │
         └──────────────────────────────────────────────────────┬────────────┘
                                                                 │
              ┌──────────────────────────────────────────────────┼────────────────────────────────────┐
              │                                                   │                                    │
    design=F, safety=F, qms=F                            design=T                         safety=T (only), qms=F, design=F
              │                                                   │                                    │
              ▼                                                   ▼                                    ▼
    ┌──────────────────┐                               ┌────────────────┐                  ┌───────────────────┐
    │  KAIZEN_APPROVED │                               │   SME_REVIEW   │                  │   SAFETY_REVIEW   │
    └──────────────────┘                               │   PENDING      │                  │   PENDING         │
                                                       └───┬─────┬──────┘                  └───────┬───────────┘
                                                           │     │                                 │
                                                        APPROVE RETURN──────────────────► HOD_REVIEW (prev)
                                                           │
                                                    ┌──────▼──────────────────────────────────────────────────┐
                                                    │  SME sets sci_tech_required flag during this approval    │
                                                    │  (sci_tech_required stored in workflow_flags)           │
                                                    └──────────────────────────┬──────────────────────────────┘
                                                                               │
                                              ┌────────────────────────────────┴──────────────────────────┐
                                    safety=T or qms=T                                           safety=F, qms=F
                                    (inherited flags)                                                    │
                                              │                                                          │
                                  ┌───────────▼──────────┐                                  ┌───────────▼──────────┐
                                  │   SAFETY_REVIEW      │                    sci_tech=T ──► │   SCI_TECH_UPLOAD    │
                                  │   (if safety=T)      │                                   │   (HOD uploads docs) │
                                  └───────────┬──────────┘                    sci_tech=F ──► │   KAIZEN_APPROVED    │
                                              │                                               └───────────┬──────────┘
                                           APPROVE                                                        │
                                              │                                                        APPROVE (HOD submits docs)
                                  ┌───────────▼──────────┐                                               │
                                  │   QUALITY_REVIEW     │                                               ▼
                                  │   (if qms=T)         │                                    ┌──────────────────┐
                                  └───────────┬──────────┘                                    │ KAIZEN_APPROVED  │
                                              │                                                └──────────────────┘
                                           APPROVE
                                              │
                                     sci_tech=T ──► SCI_TECH_UPLOAD (HOD task)
                                     sci_tech=F ──► KAIZEN_APPROVED


RETURN from SME_REVIEW      → routes back to HOD_REVIEW (prev step)
RETURN from SAFETY_REVIEW   → routes back to SME_REVIEW if present, else HOD_REVIEW
RETURN from QUALITY_REVIEW  → routes back to SAFETY_REVIEW if present,
                               else SME_REVIEW if present, else HOD_REVIEW
RETURN from SCI_TECH_UPLOAD → routes back to QUALITY_REVIEW (or prev active step)

REJECT from any step        → workflow_instance.current_status = REJECTED
                               kaizen.status = REJECTED
                               Notify: Idea Owner with comments
```

### 5.4 IMPLEMENTATION_APPROVAL Transition Table

| From Stage | Action | Condition | To Stage | Notified |
|---|---|---|---|---|
| — | One Pager submitted | — | `ZONE_LEADER_REVIEW` | Zone Leader |
| `ZONE_LEADER_REVIEW` | APPROVE | — | `HOD_REVIEW` | HOD |
| `ZONE_LEADER_REVIEW` | RETURN | comment required | Impl Owner (rework One Pager) | Impl Owner |
| `ZONE_LEADER_REVIEW` | REJECT | comment required | `KAIZEN_REJECTED` (terminal) | Idea Owner |
| `HOD_REVIEW` | APPROVE | no flags | `KAIZEN_APPROVED` (terminal) | Idea Owner, Plant OPEX |
| `HOD_REVIEW` | APPROVE | design=T | Insert + go to `SME_REVIEW` | SME |
| `HOD_REVIEW` | APPROVE | safety=T (only) | Insert + go to `SAFETY_REVIEW` | Plant Safety |
| `HOD_REVIEW` | APPROVE | qms=T (only) | Insert + go to `QUALITY_REVIEW` | Plant Quality |
| `HOD_REVIEW` | APPROVE | design=T, safety=T | Insert both, go to `SME_REVIEW` first | SME |
| `HOD_REVIEW` | RETURN | comment required | `ZONE_LEADER_REVIEW` (prev) | Zone Leader |
| `HOD_REVIEW` | REJECT | comment required | `KAIZEN_REJECTED` (terminal) | Idea Owner |
| `SME_REVIEW` | APPROVE | sci_tech=F, no safety/qms | `KAIZEN_APPROVED` (terminal) | Idea Owner, Plant OPEX |
| `SME_REVIEW` | APPROVE | sci_tech=F, safety=T | `SAFETY_REVIEW` | Plant Safety |
| `SME_REVIEW` | APPROVE | sci_tech=F, qms=T | `QUALITY_REVIEW` | Plant Quality |
| `SME_REVIEW` | APPROVE | sci_tech=T | Defer SCI_TECH to end; proceed to SAFETY/QUALITY/terminal | As above |
| `SME_REVIEW` | RETURN | comment required | `HOD_REVIEW` (prev) | HOD |
| `SME_REVIEW` | REJECT | comment required | `KAIZEN_REJECTED` (terminal) | Idea Owner |
| `SAFETY_REVIEW` | APPROVE | qms=F | Next step (SCI_TECH if required, else APPROVED) | HOD or Idea Owner |
| `SAFETY_REVIEW` | APPROVE | qms=T | `QUALITY_REVIEW` | Plant Quality |
| `SAFETY_REVIEW` | RETURN | comment required | Previous active step | Previous assignee |
| `SAFETY_REVIEW` | REJECT | comment required | `KAIZEN_REJECTED` (terminal) | Idea Owner |
| `QUALITY_REVIEW` | APPROVE | sci_tech=F | `KAIZEN_APPROVED` (terminal) | Idea Owner, Plant OPEX |
| `QUALITY_REVIEW` | APPROVE | sci_tech=T | Insert + go to `SCI_TECH_UPLOAD` | HOD |
| `QUALITY_REVIEW` | RETURN | comment required | Previous active step | Previous assignee |
| `QUALITY_REVIEW` | REJECT | comment required | `KAIZEN_REJECTED` (terminal) | Idea Owner |
| `SCI_TECH_UPLOAD` | SUBMIT (HOD uploads docs) | docs validated | `KAIZEN_APPROVED` (terminal) | Idea Owner, Plant OPEX |
| `SCI_TECH_UPLOAD` | RETURN | — | Previous active step | Previous assignee |

---

## 6. Return Routing Algorithm

Return is not a fixed-step routing. The engine resolves it dynamically at runtime.

### 6.1 Algorithm

```
FUNCTION resolve_return_target(workflow_instance_id, current_step_order):

  previous_steps = SELECT * FROM workflow_steps
                   WHERE workflow_instance_id = :id
                     AND step_order < :current_step_order
                     AND status NOT IN ('SKIPPED', 'RETURNED')
                   ORDER BY step_order DESC

  IF previous_steps is EMPTY:
    → No previous approver exists
    → Route back to submitter (Idea Owner / Implementation Owner) for rework
    → Set current step status = RETURNED
    → Notify submitter with comments

  ELSE:
    target_step = previous_steps[0]  ← highest order below current
    → Set current step status = RETURNED
    → Set target_step status = PENDING
    → Set workflow_instance.current_stage = target_step.stage_code
    → Set workflow_instance.current_status = RETURNED
    → Notify target_step.assigned_user with comments
```

### 6.2 Return Chain Example

```
Scenario: IMPLEMENTATION_APPROVAL with flags: design=T, safety=T, qms=T

Generated steps:
  step 1: ZONE_LEADER_REVIEW  ← APPROVED
  step 2: HOD_REVIEW          ← APPROVED
  step 3: SME_REVIEW          ← APPROVED
  step 4: SAFETY_REVIEW       ← active (current)
  step 5: QUALITY_REVIEW      ← PENDING
  step 6: SCI_TECH_UPLOAD     ← PENDING (sci_tech=T)

Plant Safety clicks RETURN:
  → step 4 status = RETURNED
  → Resolve: previous non-skipped/non-returned = step 3 (SME_REVIEW)
  → step 3 status = PENDING
  → Notify SME

SME reviews, approves again:
  → step 3 status = APPROVED
  → Advance to step 4 (SAFETY_REVIEW) again
  → step 4 status = PENDING
  → Notify Plant Safety
```

---

## 7. SLA Integration Points

SLA timers attach to `workflow_steps`. Each step has:
- `sla_due_at` = `action_assigned_at` + configured SLA hours from `sla_configs`
- `escalated` flag set to `true` when escalation fires

### 7.1 SLA Events

| Event | Trigger | Action |
|---|---|---|
| Reminder | `now() >= sla_due_at - reminder_offset` | Send reminder email to assignee |
| Breach | `now() >= sla_due_at` | Send escalation email to role defined in `sla_configs.escalate_to_role` |
| Second breach | `now() >= sla_due_at + second_escalation_offset` | Escalate to Plant Head |

### 7.2 SLA-Aware Stages

SLA is configurable per `stage_code` per `plant_id`. Every step in both workflows can have a distinct SLA.

---

## 8. Workflow Table State Mapping

This section shows how the abstract state machine maps to actual database rows.

### 8.1 On Idea Submission (no flags yet)

```
workflow_instances row:
  entity_type      = 'idea'
  entity_id        = <idea.id>
  workflow_type    = 'IDEA_APPROVAL'
  current_stage    = 'ZONE_LEADER_REVIEW'
  current_status   = 'PENDING'

workflow_steps rows generated from template:
  step 1: stage=ZONE_LEADER_REVIEW, assigned_user=<zone_leader>, status=PENDING
  step 2: stage=HOD_REVIEW,         assigned_user=<hod>,         status=PENDING

workflow_flags row:
  machine_design_change  = false
  safety_review_required = false
  qms_review_required    = false
  sci_tech_required      = false
```

### 8.2 After HOD Approves with safety=T, qms=T

```
workflow_flags row updated:
  safety_review_required = true
  qms_review_required    = true

workflow_steps rows dynamically inserted:
  step 3: stage=SAFETY_REVIEW,  assigned_user=<plant_safety>, status=PENDING
  step 4: stage=QUALITY_REVIEW, assigned_user=<plant_quality>, status=PENDING

workflow_instances updated:
  current_stage  = 'SAFETY_REVIEW'
  current_status = 'PENDING'
```

### 8.3 On Final Approval

```
workflow_instances:
  current_stage  = 'IDEA_APPROVED'
  current_status = 'COMPLETED'
  completed_at   = <timestamp>

ideas:
  status = 'APPROVED'

→ Trigger: assign implementation owner
→ Trigger: send approval notification to Idea Owner
→ Trigger: send notification to Plant OPEX
```

---

## 9. Rewards & Recognition State Machine

R&R is not workflow-engine-driven. It is a nomination pipeline managed directly by Plant OPEX.

```
                ┌─────────────────────────────────────────┐
                │           KAIZEN_APPROVED                │
                │  (appears in Plant OPEX: Approved tab)  │
                └──────────────────┬──────────────────────┘
                                   │
                 ┌─────────────────┼──────────────────────┐
                 │                 │                       │
          Plant OPEX assigns  Plant OPEX nominates   (No R&R action —
          Regular Reward       as High Impact          remains in Approved)
                 │                 │
                 ▼                 ▼
         ┌────────────┐   ┌──────────────────────────────────────────┐
         │ REGULAR_RR │   │            HIGH_IMPACT_NOMINATED          │
         │ (recorded) │   │  Plant OPEX assigns Steering Committee   │
         └────────────┘   │  members (1 or more)                     │
                          └─────────────────────┬────────────────────┘
                                                │
                                  All SC members must rate
                                  (gate: has_rated = true for all)
                                                │
                                  ┌─────────────▼───────────────────┐
                                  │   ALL_SC_RATINGS_COMPLETE        │
                                  │   (nomination gate unlocked)     │
                                  └─────────────┬───────────────────┘
                                                │
                         ┌──────────────────────┼─────────────────────────┐
                         │                      │                          │
                    Nominate for           Nominate for            Nominate for both
                    Special R&R         Inter-Plant Comp           simultaneously
                         │                      │                          │
                         ▼                      ▼                          ▼
                  ┌──────────┐         ┌──────────────┐         ┌──────────────────┐
                  │SPECIAL_RR│         │  INTER_PLANT  │         │ SPECIAL_RR       │
                  │(tab view)│         │  COMPETITION  │         │ + INTER_PLANT    │
                  └──────────┘         │  (tab view)   │         │ (both tab views) │
                                       └───────────────┘         └──────────────────┘

NOTE: Kaizen ALWAYS remains visible in Approved tab regardless of nominations.
      Nominations add visibility to additional tabs — they do not move the record.
      A Kaizen can simultaneously appear in: Approved + Kaizen R&R + High Impact R&R + Inter-Plant Competition
```

---

## 10. Notification Trigger Map

Every state transition fires a notification. This maps transitions to BRD requirements.

| Transition | BRD Ref | Recipients |
|---|---|---|
| Idea submitted | F101, F102, F103 | Idea Owner (confirmation), Plant OPEX, Zone Leader |
| Zone Leader approves → HOD | F104 | HOD |
| Any approver approves → next | F104, F105 | Next approver |
| Zone Leader / HOD / Safety / Quality returns | F106, F107 | Previous approver + Idea Owner |
| Any rejects | F107 | Idea Owner (with comments) |
| Idea fully approved | F108, F112, F114 | Implementation Owner, Plant OPEX, Idea Owner |
| One Pager submitted | F109 | Zone Leader |
| Each impl step approves → next | F110 | Next approver |
| SME sets sci_tech_required | F111 | HOD |
| Kaizen fully approved | F113, F115 | Plant OPEX, Idea Owner |
| Regular Reward assigned | F099 | Idea Owner |
| Special Reward nominated | F099 | Idea Owner |
| Inter-Plant Competition selected | F099 | Idea Owner |

---

## 11. Audit Log Events

Every state transition must write an immutable `audit_logs` row.

| Trigger | `action` value |
|---|---|
| Idea submitted | `IDEA_SUBMITTED` |
| Any step approved | `STEP_APPROVED` |
| Any step returned | `STEP_RETURNED` |
| Any step rejected | `STEP_REJECTED` |
| Idea marked as Implemented | `MARKED_IMPLEMENTED` |
| One Pager saved as draft | `ONE_PAGER_DRAFT_SAVED` |
| One Pager submitted | `ONE_PAGER_SUBMITTED` |
| Sci-Tech docs uploaded | `SCI_TECH_UPLOADED` |
| Kaizen approved | `KAIZEN_APPROVED` |
| Regular reward assigned | `REGULAR_REWARD_ASSIGNED` |
| High impact nominated | `HIGH_IMPACT_NOMINATED` |
| SC member rated | `SC_RATING_SUBMITTED` |
| Special reward nominated | `SPECIAL_REWARD_NOMINATED` |
| Inter-plant competition nominated | `INTER_PLANT_NOMINATED` |
| SLA reminder sent | `SLA_REMINDER_SENT` |
| SLA escalation fired | `SLA_ESCALATED` |

---

## 12. State Machine Validation Rules

Before any workflow step is executed, the engine validates:

```
1. workflow_instance.current_status == 'PENDING'
   → Reject duplicate actions on the same step

2. performing_user matches workflow_step.assigned_user_id
   → Reject unauthorized approvals (RBAC layer also enforces this)

3. For RETURN action: comment field is NOT NULL and NOT empty
   → Reject silent returns

4. For REJECT action: comment field is NOT NULL and NOT empty
   → Reject silent rejections

5. For SCI_TECH_UPLOAD: at least one document uploaded
   → Reject empty submissions

6. For SC rating submission: all mandatory rating criteria filled
   → Reject partial ratings
```

---

*Document end. Next: ER Diagram → Role Matrix → API Contract → System Architecture.*
