-- 006_phase6_qa_data.sql
-- Phase 6 QA seed data — covers all manual QA scenarios.
-- Safe to re-run: all INSERTs use ON CONFLICT DO NOTHING.
-- Run ONLY in development.
--
-- Credentials: all users Password123
-- Plant:  ACG Plant Nashik       (10000000-0000-0000-0000-000000000001)
-- Zone:   Zone A                 (20000000-0000-0000-0000-000000000001)
-- Dept:   Engineering            (30000000-0000-0000-0000-000000000001)
--
-- Test Users (from 005_dev_data.sql):
--   associate@acg.com  → Plant Associate  (EMP002 / Raj Kumar)
--   zoneleader@acg.com → Zone Leader      (EMP003 / Priya Sharma)
--   hod@acg.com        → HOD              (EMP004 / Vikram Nair)
--   opex@acg.com       → Plant OPEX       (EMP005 / Anita Desai)
--
-- ─── Extra test user: Management Associate ───────────────────────────────────

INSERT INTO users (id, employee_id, email, full_name, phone, password_hash, is_active, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000008', 'EMP008', 'mgmt@acg.com', 'Deepak Joshi', '9000000008',
   '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Assign Management Associate role (00000000-0000-0000-0000-000000000002) to Deepak Joshi
INSERT INTO user_roles (user_id, role_id, plant_id, zone_id, department_id, granted_at, granted_by) VALUES
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id, role_id, plant_id) DO NOTHING;

-- ─── Extra test user: SME ─────────────────────────────────────────────────────

INSERT INTO users (id, employee_id, email, full_name, phone, password_hash, is_active, created_at, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000009', 'EMP009', 'sme@acg.com', 'Ramesh Iyer', '9000000009',
   '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, plant_id, zone_id, department_id, granted_at, granted_by) VALUES
  ('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000008',
   '10000000-0000-0000-0000-000000000001', NULL, NULL, NOW(), 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id, role_id, plant_id) DO NOTHING;

-- =============================================================================
-- IDEAS
-- =============================================================================
-- Stable UUIDs for ideas:
--   I-001  APPROVED  — submitted by Plant Associate  → QA: Mark Implemented (PA → ZL owns)
--   I-002  APPROVED  — submitted by Mgmt Associate   → QA: Mark Implemented (MA → self owns)
--   I-003  APPROVED  — with safety + QMS flags       → QA: Dynamic workflow routing
--   I-004  APPROVED  — with machine_design_change    → QA: SME route
--   I-005  APPROVED  — with sci_tech_required        → QA: HOD SCI_TECH_UPLOAD route
--   I-006  APPROVED  — already has kaizen IN_PROGRESS → QA: Open One Pager, edit draft
--   I-007  APPROVED  — already has kaizen ONE_PAGER_SUBMITTED → QA: read-only view
--   I-008  APPROVED  — already has kaizen APPROVED   → QA: completed kaizen
--   I-009  APPROVED  — already has kaizen REJECTED   → QA: rejected kaizen
--   I-010  SUBMITTED — in workflow (pending approval) → QA: cannot mark implemented
--   I-011  REJECTED  — rejected idea                 → QA: not in queue
--   I-012  DRAFT     — draft idea                    → QA: not in queue
-- =============================================================================

INSERT INTO ideas
  (id, registration_id, submitted_by, plant_id, zone_id, department_id, category_id,
   title, description, problem_statement, proposed_solution, expected_benefits,
   is_anonymous, status, submitted_at, created_at, updated_at)
VALUES
-- ── I-001: APPROVED, Plant Associate submitter — ready to mark implemented ──
  ('b0000000-0000-0000-0000-000000000001',
   'KIET-2026-0001',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar (Plant Associate)
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000003',  -- Productivity
   'Reduce setup time on CNC Line 3',
   'Current setup time on CNC Line 3 averages 45 minutes per changeover, significantly impacting production throughput.',
   'CNC Line 3 changeover takes 45 minutes due to manual tool positioning with no reference marks. This causes 3-4 lost production slots per shift.',
   'Add laser-etched reference marks on all tooling fixtures to enable parallel setup activities.',
   'Reduce setup time by 60% to approximately 18 minutes, gain 2-3 additional production slots per shift.',
   FALSE, 'APPROVED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),

-- ── I-002: APPROVED, Management Associate submitter — MA becomes implementation owner ──
  ('b0000000-0000-0000-0000-000000000002',
   'KIET-2026-0002',
   'a0000000-0000-0000-0000-000000000008',  -- Deepak Joshi (Management Associate)
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000002',  -- Quality
   'Eliminate cosmetic defects in packaging line B',
   'Packaging Line B produces 2.3% cosmetic defects per batch, exceeding the 1% SLA target.',
   'Packaging Line B produces cosmetic defects at 2.3% — primarily dented corners from the conveyor transfer point. SLA target is under 1%.',
   'Install rubber bumper guards at all transfer points and re-calibrate conveyor speed profiles.',
   'Reduce cosmetic defect rate below 1%, saving approximately ₹40,000 per month in rework costs.',
   FALSE, 'APPROVED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '1 day'),

-- ── I-003: APPROVED, safety + QMS flags — for dynamic routing test ──
  ('b0000000-0000-0000-0000-000000000003',
   'KIET-2026-0003',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000001',  -- Safety
   'Improve chemical storage ventilation in Bay 4',
   'Bay 4 stores Class-C solvents with inadequate ventilation causing VOC buildup beyond permissible limits.',
   'Bay 4 VOC concentration exceeds 50 ppm permissible limit during peak storage hours, posing inhalation risk to workers.',
   'Install forced-exhaust ventilation fan and CO/VOC sensor with automatic alarm at 40 ppm threshold.',
   'Bring VOC levels below 30 ppm; achieve ISO 45001 compliance for chemical storage; reduce near-miss incidents.',
   FALSE, 'APPROVED', NOW() - INTERVAL '15 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 days'),

-- ── I-004: APPROVED, machine_design_change flag — SME route ──
  ('b0000000-0000-0000-0000-000000000004',
   'KIET-2026-0004',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000003',  -- Productivity
   'Redesign press tool die for longer life cycle',
   'The current press tool die requires replacement every 50,000 cycles, increasing tooling costs and downtime.',
   'Press Tool Die on Line 7 wears out at 50,000 cycles — below the 80,000 industry benchmark — requiring costly replacements every 3 weeks.',
   'Change die material from D2 steel to M2 high-speed steel and add surface nitriding treatment.',
   'Extend die life to 90,000+ cycles; reduce tooling cost by ₹1.2L/year; reduce unplanned downtime by 70%.',
   FALSE, 'APPROVED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '5 days'),

-- ── I-005: APPROVED, sci_tech_required flag — HOD SCI_TECH_UPLOAD route ──
  ('b0000000-0000-0000-0000-000000000005',
   'KIET-2026-0005',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000003',  -- Productivity
   'Apply TPM autonomous maintenance schedule using AI-based vibration analysis',
   'Unplanned machine breakdowns occur 4-5 times per month due to absence of predictive maintenance protocols.',
   'Motor failures on Compressor Unit 2 occur without warning — 4 unplanned breakdowns in the last quarter, costing ₹2.8L in repairs and lost output.',
   'Implement IoT vibration sensors on all critical motors with AI-based anomaly detection integrated into CMMS.',
   'Predict 85% of failures 2 weeks in advance; reduce unplanned downtime by 80%; ROI within 8 months.',
   FALSE, 'APPROVED', NOW() - INTERVAL '14 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days'),

-- ── I-006: APPROVED, kaizen IN_PROGRESS (Documentation Pending) — draft editable ──
  ('b0000000-0000-0000-0000-000000000006',
   'KIET-2026-0006',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000002',  -- Quality
   'Reduce solder defects on SMT line using preheat profile optimization',
   'SMT Line 2 solder joint failure rate is 3.1%, exceeding the 1.5% target. PCB rework cost is ₹18,000/week.',
   'SMT Line 2 solder joint failures at 3.1% — tombstoning and cold joints are the dominant defect types. Root cause traced to inconsistent preheat zone temperatures.',
   'Reprogram reflow oven preheat profiles per IPC-7711/7721 thermal gradient specs; add thermocouple validation at zone 3.',
   'Reduce solder defect rate to below 1.5%; eliminate ₹18,000/week rework cost; achieve IPC Class 2 compliance.',
   FALSE, 'APPROVED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),

-- ── I-007: APPROVED, kaizen ONE_PAGER_SUBMITTED (Under Review) — read-only ──
  ('b0000000-0000-0000-0000-000000000007',
   'KIET-2026-0007',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000003',  -- Productivity
   'Implement 5S visual management in stores area',
   'Stores area retrieval time averages 12 minutes per item request due to poor organization and no visual management.',
   'Stores area has no visual management system — retrieval time for spare parts averages 12 minutes per request. Shadow boards and bin labeling are absent.',
   'Implement 5S methodology: sort, set in order, shine, standardize, sustain. Install shadow boards and barcode-based bin system.',
   'Reduce retrieval time to under 3 minutes; eliminate lost parts incidents; achieve 5S Gold certification.',
   FALSE, 'APPROVED', NOW() - INTERVAL '25 days', NOW() - INTERVAL '26 days', NOW() - INTERVAL '10 days'),

-- ── I-008: APPROVED, kaizen APPROVED — implementation complete ──
  ('b0000000-0000-0000-0000-000000000008',
   'KIET-2026-0008',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000001',  -- Safety
   'Install anti-slip mats at all wet process stations',
   'Three slip-and-fall incidents occurred in the last two quarters at wet process stations where water pooling was not addressed.',
   'Wet process stations in Bay 2 have recurring water pooling — 3 slip-and-fall incidents in 2 quarters. No anti-slip surfacing exists.',
   'Install industrial-grade anti-slip mats and add drainage channels at all 8 wet process stations.',
   'Zero slip incidents; achieve 5-star safety audit score for wet areas; estimated ₹60,000/year in incident cost savings.',
   FALSE, 'APPROVED', NOW() - INTERVAL '40 days', NOW() - INTERVAL '41 days', NOW() - INTERVAL '30 days'),

-- ── I-009: APPROVED, kaizen REJECTED — implementation rejected ──
  ('b0000000-0000-0000-0000-000000000009',
   'KIET-2026-0009',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000002',  -- Quality
   'Replace manual torque wrenches with digital torque tools',
   'Manual torque wrench calibration drift causes 0.8% fastener under-torque defects on assembly line.',
   'Manual torque wrenches on Assembly Line 4 drift out of calibration, causing 0.8% under-torque defects that are only caught at final inspection.',
   'Replace all 12 manual torque wrenches with digital tools with real-time torque monitoring and auto-alerts.',
   'Eliminate under-torque defects; reduce warranty claims by estimated ₹1.5L/year.',
   FALSE, 'APPROVED', NOW() - INTERVAL '35 days', NOW() - INTERVAL '36 days', NOW() - INTERVAL '25 days'),

-- ── I-010: SUBMITTED (in approval workflow) — should NOT appear in implementation queue ──
  ('b0000000-0000-0000-0000-000000000010',
   'KIET-2026-0010',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000003',  -- Productivity
   'Optimize raw material staging layout to reduce forklift travel distance',
   'Forklift travel distance in raw material staging area is 340m per trip due to non-optimized layout.',
   'Raw material staging layout requires forklifts to travel 340m per round trip to the production line — 2.5x the optimal path. 12 trips per shift.',
   'Redesign staging layout using spaghetti diagram analysis to minimize travel distance to under 150m.',
   'Reduce forklift travel by 55%; improve throughput by 1.5 units/shift; save ₹22,000/month in fuel and time.',
   FALSE, 'SUBMITTED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),

-- ── I-011: REJECTED — should NOT appear in implementation queue ──
  ('b0000000-0000-0000-0000-000000000011',
   'KIET-2026-0011',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000001',  -- Safety
   'Install automated temperature monitoring in server room',
   'Server room temperature occasionally exceeds 28C during summer peak causing hardware throttling.',
   'Server room temperature spikes above 28°C on peak summer days, causing hardware throttling and two outages last year.',
   'Install IoT temperature sensors with auto-alert at 25°C threshold and backup cooling unit.',
   'Prevent hardware outages; reduce IT downtime by estimated 40 hours/year.',
   FALSE, 'REJECTED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),

-- ── I-012: DRAFT — should NOT appear in implementation queue ──
  ('b0000000-0000-0000-0000-000000000012',
   NULL,
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   '10000000-0000-0000-0000-000000000001',
   '20000000-0000-0000-0000-000000000001',
   '30000000-0000-0000-0000-000000000001',
   '40000000-0000-0000-0000-000000000002',  -- Quality
   'Draft: Improve incoming QC inspection speed',
   'Incoming QC inspection takes too long.',
   'Incoming QC inspection averages 40 minutes per batch but could be reduced with digital checklists.',
   NULL, NULL,
   FALSE, 'DRAFT', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- WORKFLOW INSTANCES + FLAGS for ideas I-003, I-004, I-005
-- (flags determine dynamic routing when their kaizens are submitted for impl approval)
-- =============================================================================

-- I-003: safety_review_required + qms_review_required
INSERT INTO workflow_instances
  (id, template_id, entity_type, entity_id, workflow_type, current_stage, current_status,
   initiated_by, initiated_at, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000003',
   '00000000-0000-0000-0002-000000000001',  -- IDEA_APPROVAL template
   'idea', 'b0000000-0000-0000-0000-000000000003', 'IDEA_APPROVAL',
   'HOD_REVIEW', 'COMPLETED',
   'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow_flags (workflow_instance_id, machine_design_change, safety_review_required, qms_review_required, sci_tech_required)
VALUES ('c0000000-0000-0000-0000-000000000003', FALSE, TRUE, TRUE, FALSE)
ON CONFLICT (workflow_instance_id) DO NOTHING;

-- I-004: machine_design_change
INSERT INTO workflow_instances
  (id, template_id, entity_type, entity_id, workflow_type, current_stage, current_status,
   initiated_by, initiated_at, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000004',
   '00000000-0000-0000-0002-000000000001',
   'idea', 'b0000000-0000-0000-0000-000000000004', 'IDEA_APPROVAL',
   'HOD_REVIEW', 'COMPLETED',
   'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow_flags (workflow_instance_id, machine_design_change, safety_review_required, qms_review_required, sci_tech_required)
VALUES ('c0000000-0000-0000-0000-000000000004', TRUE, FALSE, FALSE, FALSE)
ON CONFLICT (workflow_instance_id) DO NOTHING;

-- I-005: sci_tech_required
INSERT INTO workflow_instances
  (id, template_id, entity_type, entity_id, workflow_type, current_stage, current_status,
   initiated_by, initiated_at, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000005',
   '00000000-0000-0000-0002-000000000001',
   'idea', 'b0000000-0000-0000-0000-000000000005', 'IDEA_APPROVAL',
   'HOD_REVIEW', 'COMPLETED',
   'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow_flags (workflow_instance_id, machine_design_change, safety_review_required, qms_review_required, sci_tech_required)
VALUES ('c0000000-0000-0000-0000-000000000005', FALSE, FALSE, FALSE, TRUE)
ON CONFLICT (workflow_instance_id) DO NOTHING;

-- =============================================================================
-- KAIZENS
-- =============================================================================
-- K-006: idea I-006, IN_PROGRESS (Documentation Pending) — partial draft
-- K-007: idea I-007, ONE_PAGER_SUBMITTED (Under Review)
-- K-008: idea I-008, APPROVED (completed)
-- K-009: idea I-009, REJECTED (rejected)
-- =============================================================================

INSERT INTO kaizens
  (id, kaizen_id, idea_id, implementation_owner, assigned_by, title, status,
   team_members, business_impact, before_description,
   w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how,
   why_1, why_2, why_3,
   root_cause_analysis, category_of_cause, solution_implemented, results,
   after_description, cost, benefit, early_equipment_mgmt, applicable_documents, remarks,
   one_pager_submitted_at, created_at, updated_at)
VALUES

-- K-006: IN_PROGRESS — partial draft, can be opened and edited
  ('d0000000-0000-0000-0000-000000000006',
   'KIET-K-2026-0001',
   'b0000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000003',  -- Priya Sharma (Zone Leader) as owner
   'a0000000-0000-0000-0000-000000000003',
   'Reduce solder defects on SMT line using preheat profile optimization',
   'IN_PROGRESS',
   'Raj Kumar, Priya Sharma, Electrical Team',
   'Reduces rework cost by ₹18,000/week; achieves IPC Class 2 compliance; improves customer delivery performance.',
   'SMT Line 2 reflow oven preheat zone temperatures fluctuate ±8°C from set points. No process validation on zone 3. Visual: tombstoning defects visible on 0402 components.',
   'Electrical maintenance team and process engineer',
   'Solder joint failures during reflow — tombstoning and cold joints',
   'SMT Line 2, Zone A, Bay 3',
   'Ongoing since Q2 2026 — defect rate worsened after oven PM in April',
   'Inconsistent thermal gradient in preheat zone causes differential expansion rates in component leads',
   'Reprogram preheat profiles + validate with thermocouple measurement at each zone',
   'Why did tombstoning increase? Preheat temperature too aggressive',
   'Why was preheat temperature too aggressive? Profile was not updated after oven maintenance',
   'Why was profile not updated? No procedure mandated profile revalidation post-maintenance',
   -- root_cause_analysis left NULL to demonstrate incomplete draft
   NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, FALSE, NULL, NULL,
   NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day'),

-- K-007: ONE_PAGER_SUBMITTED — fully filled, read-only
  ('d0000000-0000-0000-0000-000000000007',
   'KIET-K-2026-0002',
   'b0000000-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000003',  -- Priya Sharma
   'a0000000-0000-0000-0000-000000000003',
   'Implement 5S visual management in stores area',
   'ONE_PAGER_SUBMITTED',
   'Priya Sharma, Stores Team (4 members), Industrial Engineering',
   'Reduces retrieval time from 12 minutes to under 3 minutes. Eliminates lost-part incidents. Supports 5S Gold audit target.',
   'Stores area with no visual management — items placed randomly, no shadow boards, no bin labels, no min-max indicators. Retrieval requires verbal guidance from senior storekeeper.',
   'Stores team and production planners',
   'Inability to locate spare parts quickly during breakdown maintenance',
   'Stores area, Building C, Ground Floor',
   'Daily — affects every maintenance work order',
   'Absence of visual management causes wasted motion and searching time',
   'Deploy 5S: designate storage locations, install shadow boards, label bins with barcodes',
   'Why does retrieval take 12 minutes? No designated location for items',
   'Why no designated location? 5S was never implemented in stores',
   'Why was 5S never implemented? No structured initiative or accountability',
   'Why no initiative? 5S not included in departmental KPIs',
   'Why not in KPIs? Senior management did not prioritize stores in last annual target-setting',
   'Root cause: 5S not mandated as a KPI for the stores function. No ownership assigned. Items accumulated without organization over 3+ years.',
   'Method', -- category_of_cause
   'Implemented full 5S methodology over 2 weeks: (1) Sort — removed 340 obsolete items. (2) Set in Order — created 8 shadow boards with 220 designated locations. (3) Shine — deep-cleaned all racks. (4) Standardize — SOP created for item receipt and return. (5) Sustain — weekly 5S audit checklist assigned to shift supervisor.',
   'Retrieval time reduced from 12 minutes to 2.5 minutes average. Zero lost-part incidents in 3 weeks post-implementation. 5S internal audit score improved from 38% to 84%.',
   'Stores area post-5S: all items in designated locations with barcode labels. Shadow boards installed for all critical spares. Min-max indicators clearly marked.',
   15000.00, 85000.00, FALSE,
   'ISO 45001:2018 Clause 8.1 — Operational Planning; 5S Audit Checklist v2.1',
   'Shadow boards and bin labels procured locally. Implementation done during morning shift over 2 consecutive weekends.',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '22 days', NOW() - INTERVAL '5 days'),

-- K-008: APPROVED kaizen — completed flow end-to-end
  ('d0000000-0000-0000-0000-000000000008',
   'KIET-K-2026-0003',
   'b0000000-0000-0000-0000-000000000008',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar (self — PA scenario)
   'a0000000-0000-0000-0000-000000000003',
   'Install anti-slip mats at all wet process stations',
   'APPROVED',
   'Raj Kumar, Safety Team, Facilities',
   'Zero slip incidents after implementation. Safety audit score improved. Estimated ₹60,000/year incident cost avoided.',
   'Wet process stations in Bay 2 — water pooling on floor surface with no anti-slip treatment. Workers standing in water during operation.',
   'Bay 2 wet process operators and safety team',
   'Slip-and-fall hazard at wet process stations',
   'Bay 2, Wet Process Section — 8 stations',
   '3 incidents in 2 quarters — ongoing hazard',
   'Wet process generates water runoff; no drainage channels; no anti-slip surface',
   'Install anti-slip mats + drainage channels; daily housekeeping SOP',
   'Why do slips occur? Floor is wet and slippery',
   'Why is floor wet? Water runoff from wet process with no drainage',
   'Why no drainage? Bay 2 was designed for dry process — drainage not included in original layout',
   'Why was drainage not retrofitted? Not included in any previous improvement cycle',
   'Why not in previous cycles? Safety audits flagged it but corrective action was not assigned an owner',
   'Root cause: Bay 2 original design did not include drainage. When wet process was added, drainage and anti-slip surfacing were not retrofitted. Repeated safety audit findings were not converted into owned corrective actions.',
   'Environment',
   'Installed 8 industrial-grade anti-slip mats (600x900mm, 8mm thick) with drainage channels at each station. Added floor drainage sloped at 2° gradient. Updated daily housekeeping SOP to include wet area inspection.',
   'Zero slip incidents in 30 days post-installation. Bay 2 wet area safety score improved from 3.2 to 4.8/5 in last internal audit.',
   'Bay 2 wet process stations with anti-slip mats installed and drainage channels active. Dry floor surface confirmed after shift.',
   58000.00, 240000.00, FALSE,
   'ISO 45001:2018 Clause 10.2; Internal Safety Checklist Bay 2',
   'Mats sourced from approved vendor list. Drainage channels installed by facilities team over one weekend.',
   NOW() - INTERVAL '20 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '10 days'),

-- K-009: REJECTED kaizen — rejected during review
  ('d0000000-0000-0000-0000-000000000009',
   'KIET-K-2026-0004',
   'b0000000-0000-0000-0000-000000000009',
   'a0000000-0000-0000-0000-000000000002',  -- Raj Kumar
   'a0000000-0000-0000-0000-000000000003',
   'Replace manual torque wrenches with digital torque tools',
   'REJECTED',
   'Raj Kumar, Assembly Team',
   'Eliminates under-torque defects; reduces warranty claims by ₹1.5L/year.',
   'Assembly Line 4 uses 12 manual torque wrenches that drift out of calibration within 6 months. Under-torque defects reach final inspection creating rework and customer escapes.',
   'Assembly Line 4 operators and quality inspector',
   'Under-torque defects caused by calibration drift in manual torque wrenches',
   'Assembly Line 4, Building A',
   'Ongoing — defects identified at final inspection every 2-3 weeks',
   'Manual torque wrenches have inherent calibration drift without real-time feedback',
   'Replace manual with digital torque wrenches with real-time monitoring',
   'Why do under-torque defects occur? Torque wrenches drift out of calibration',
   'Why do they drift? Manual wrenches have no feedback mechanism',
   'Why no feedback? Manual tool design limitation',
   'Root cause: Manual torque wrench design does not provide real-time feedback. Calibration intervals of 6 months are too long for the usage intensity on Assembly Line 4.',
   'Machine',
   'Procured 12 digital torque wrenches with 1% accuracy and Bluetooth data logging. Configured torque limits in CMMS. Updated work instructions for Line 4.',
   'N/A — rejected before results could be measured',
   NULL,
   120000.00, 450000.00, FALSE,
   'IPC-A-620 Workmanship Standard; Calibration Procedure CAL-007',
   'Rejection reason from Zone Leader: Cost vs benefit analysis needs to include maintenance contract for digital tools. Resubmit with updated financials.',
   NOW() - INTERVAL '15 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days')

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- WORKFLOW INSTANCES + STEPS for K-007 (ONE_PAGER_SUBMITTED — under review)
-- =============================================================================

INSERT INTO workflow_instances
  (id, template_id, entity_type, entity_id, workflow_type, current_stage, current_status,
   initiated_by, initiated_at, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000007',
   '00000000-0000-0000-0002-000000000002',  -- IMPLEMENTATION_APPROVAL template
   'kaizen', 'd0000000-0000-0000-0000-000000000007', 'IMPLEMENTATION_APPROVAL',
   'ZONE_LEADER_REVIEW', 'PENDING',
   'a0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow_flags (workflow_instance_id, machine_design_change, safety_review_required, qms_review_required, sci_tech_required)
VALUES ('c0000000-0000-0000-0000-000000000007', FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (workflow_instance_id) DO NOTHING;

INSERT INTO workflow_steps
  (id, workflow_instance_id, step_order, stage_code, assigned_to, status, is_dynamic,
   sla_hours, assigned_at, created_at, updated_at)
VALUES
  ('e0000000-0000-0000-0000-000000000071',
   'c0000000-0000-0000-0000-000000000007', 1, 'ZONE_LEADER_REVIEW',
   'a0000000-0000-0000-0000-000000000003', 'PENDING', FALSE, 72,
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('e0000000-0000-0000-0000-000000000072',
   'c0000000-0000-0000-0000-000000000007', 2, 'HOD_REVIEW',
   'a0000000-0000-0000-0000-000000000004', 'PENDING', FALSE, 72,
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- WORKFLOW INSTANCES + STEPS for K-008 (APPROVED kaizen — full workflow completed)
-- =============================================================================

INSERT INTO workflow_instances
  (id, template_id, entity_type, entity_id, workflow_type, current_stage, current_status,
   initiated_by, initiated_at, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0002-000000000002',
   'kaizen', 'd0000000-0000-0000-0000-000000000008', 'IMPLEMENTATION_APPROVAL',
   'HOD_REVIEW', 'COMPLETED',
   'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow_flags (workflow_instance_id, machine_design_change, safety_review_required, qms_review_required, sci_tech_required)
VALUES ('c0000000-0000-0000-0000-000000000008', FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (workflow_instance_id) DO NOTHING;

INSERT INTO workflow_steps
  (id, workflow_instance_id, step_order, stage_code, assigned_to, status, is_dynamic,
   sla_hours, action_taken, action_taken_at, assigned_at, created_at, updated_at)
VALUES
  ('e0000000-0000-0000-0000-000000000081',
   'c0000000-0000-0000-0000-000000000008', 1, 'ZONE_LEADER_REVIEW',
   'a0000000-0000-0000-0000-000000000003', 'APPROVED', FALSE, 72,
   'APPROVE', NOW() - INTERVAL '18 days',
   NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '18 days'),
  ('e0000000-0000-0000-0000-000000000082',
   'c0000000-0000-0000-0000-000000000008', 2, 'HOD_REVIEW',
   'a0000000-0000-0000-0000-000000000004', 'APPROVED', FALSE, 72,
   'APPROVE', NOW() - INTERVAL '10 days',
   NOW() - INTERVAL '18 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- WORKFLOW INSTANCES + STEPS for K-009 (REJECTED kaizen)
-- =============================================================================

INSERT INTO workflow_instances
  (id, template_id, entity_type, entity_id, workflow_type, current_stage, current_status,
   initiated_by, initiated_at, created_at, updated_at)
VALUES
  ('c0000000-0000-0000-0000-000000000009',
   '00000000-0000-0000-0002-000000000002',
   'kaizen', 'd0000000-0000-0000-0000-000000000009', 'IMPLEMENTATION_APPROVAL',
   'ZONE_LEADER_REVIEW', 'REJECTED',
   'a0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow_flags (workflow_instance_id, machine_design_change, safety_review_required, qms_review_required, sci_tech_required)
VALUES ('c0000000-0000-0000-0000-000000000009', FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (workflow_instance_id) DO NOTHING;

INSERT INTO workflow_steps
  (id, workflow_instance_id, step_order, stage_code, assigned_to, status, is_dynamic,
   sla_hours, action_taken, remarks, action_taken_at, assigned_at, created_at, updated_at)
VALUES
  ('e0000000-0000-0000-0000-000000000091',
   'c0000000-0000-0000-0000-000000000009', 1, 'ZONE_LEADER_REVIEW',
   'a0000000-0000-0000-0000-000000000003', 'REJECTED', FALSE, 72,
   'REJECT',
   'Cost vs benefit analysis needs to include maintenance contract for digital tools. Resubmit with updated financials.',
   NOW() - INTERVAL '15 days',
   NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- AUDIT LOGS (immutable — for QA-8 verification)
-- =============================================================================

INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at)
VALUES
  ('a0000000-0000-0000-0000-000000000003', 'MARK_IMPLEMENTED', 'idea',
   'b0000000-0000-0000-0000-000000000006',
   '{"kaizen_id":"KIET-K-2026-0001","kaizen_uuid":"d0000000-0000-0000-0000-000000000006","implementation_owner":"a0000000-0000-0000-0000-000000000003","auto_assigned_role":"Plant Associate"}',
   NOW() - INTERVAL '6 days'),
  ('a0000000-0000-0000-0000-000000000003', 'MARK_IMPLEMENTED', 'idea',
   'b0000000-0000-0000-0000-000000000007',
   '{"kaizen_id":"KIET-K-2026-0002","kaizen_uuid":"d0000000-0000-0000-0000-000000000007","implementation_owner":"a0000000-0000-0000-0000-000000000003","auto_assigned_role":"Plant Associate"}',
   NOW() - INTERVAL '22 days'),
  ('a0000000-0000-0000-0000-000000000003', 'ONE_PAGER_SUBMITTED', 'kaizen',
   'd0000000-0000-0000-0000-000000000007',
   '{"kaizen_id":"KIET-K-2026-0002","workflow_instance_id":"c0000000-0000-0000-0000-000000000007","inherited_flags":{"machine_design_change":false,"safety_review_required":false,"qms_review_required":false,"sci_tech_required":false}}',
   NOW() - INTERVAL '5 days'),
  ('a0000000-0000-0000-0000-000000000002', 'MARK_IMPLEMENTED', 'idea',
   'b0000000-0000-0000-0000-000000000008',
   '{"kaizen_id":"KIET-K-2026-0003","kaizen_uuid":"d0000000-0000-0000-0000-000000000008","implementation_owner":"a0000000-0000-0000-0000-000000000002","auto_assigned_role":"Plant Associate"}',
   NOW() - INTERVAL '35 days'),
  ('a0000000-0000-0000-0000-000000000002', 'MARK_IMPLEMENTED', 'idea',
   'b0000000-0000-0000-0000-000000000009',
   '{"kaizen_id":"KIET-K-2026-0004","kaizen_uuid":"d0000000-0000-0000-0000-000000000009","implementation_owner":"a0000000-0000-0000-0000-000000000002","auto_assigned_role":"Plant Associate"}',
   NOW() - INTERVAL '30 days')
ON CONFLICT DO NOTHING;
