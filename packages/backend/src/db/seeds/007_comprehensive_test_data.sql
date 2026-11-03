-- =============================================================================
-- 007_comprehensive_test_data.sql  (v2 — corrected)
-- Comprehensive test data covering EVERY tab, status, and workflow state.
-- Password for all users: Password123
-- Hash: $2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2
--
-- UUID prefix guide (all valid hex):
--   Users:              a0000000-...  (existing)  /  new: use IDs below
--   Plants/Zones/Depts: 10/20/30
--   Functions:          50000000-...
--   Halls:              60000000-...
--   Locations:          70000000-...
--   Categories:         40000000-...
--   Sub-categories:     45000000-...
--   Ideas:              b1000000-...
--   WF Instances:       c1000000-...  (idea) / c2000000-... (kaizen)
--   WF Steps:           d1000000-...  (idea) / d2000000-... (kaizen)
--   WF Flags:           df000000-...
--   Kaizens:            f1000000-...
--   Rewards:            e0000000-...
--   High Impact:        e1000000-...
--   SC Ratings:         e2000000-...
--   Inter-Plant:        e3000000-...
--   Notifications:      e4000000-...
--   Audit Logs:         e5000000-...
-- =============================================================================

-- =============================================================================
-- SECTION 1: MASTER DATA
-- =============================================================================

-- Extra plant
INSERT INTO plants (id, name, code, address, is_active) VALUES
  ('10000000-0000-0000-0000-000000000002', 'ACG Plant Pune', 'PNE', 'Pune, Maharashtra', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Extra zones for Nashik
INSERT INTO zones (id, name, code, plant_id, is_active) VALUES
  ('20000000-0000-0000-0000-000000000002', 'Zone B', 'NSK-B', '10000000-0000-0000-0000-000000000001', TRUE),
  ('20000000-0000-0000-0000-000000000003', 'Zone C', 'NSK-C', '10000000-0000-0000-0000-000000000001', TRUE),
  ('20000000-0000-0000-0000-000000000004', 'Zone A-PNE', 'PNE-A', '10000000-0000-0000-0000-000000000002', TRUE)
ON CONFLICT (code, plant_id) DO NOTHING;

-- Extra departments (use ON CONFLICT (id) — no unique on code)
INSERT INTO departments (id, name, code, plant_id, zone_id, is_active) VALUES
  ('30000000-0000-0000-0000-000000000002', 'Production',       'NSK-A-PRD', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', TRUE),
  ('30000000-0000-0000-0000-000000000003', 'Maintenance',      'NSK-B-MNT', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', TRUE),
  ('30000000-0000-0000-0000-000000000004', 'Quality Assurance','NSK-B-QA',  '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Functions
INSERT INTO functions (id, dept_id, name, code, is_active) VALUES
  ('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Mechanical',        'NSK-A-ENG-MECH', TRUE),
  ('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'Electrical',        'NSK-A-ENG-ELEC', TRUE),
  ('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', 'Assembly Line',     'NSK-A-PRD-ASSM', TRUE),
  ('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 'Packaging',         'NSK-A-PRD-PACK', TRUE),
  ('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', 'Preventive Maint.', 'NSK-B-MNT-PM',   TRUE),
  ('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000004', 'In-Process QC',     'NSK-B-QA-IPC',   TRUE)
ON CONFLICT (id) DO NOTHING;

-- Halls
INSERT INTO halls (id, func_id, name, code, is_active) VALUES
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Hall A1', 'H-NSK-MECH-1', TRUE),
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Hall A2', 'H-NSK-MECH-2', TRUE),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'Hall B1', 'H-NSK-ASSM-1', TRUE),
  ('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 'Hall B2', 'H-NSK-PACK-1', TRUE),
  ('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', 'Hall C1', 'H-NSK-MNT-1',  TRUE),
  ('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', 'Hall C2', 'H-NSK-QA-1',   TRUE)
ON CONFLICT (id) DO NOTHING;

-- Locations
INSERT INTO locations (id, hall_id, name, code, is_active) VALUES
  ('70000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Bay 1',       'L-H1-B1', TRUE),
  ('70000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', 'Bay 2',       'L-H1-B2', TRUE),
  ('70000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', 'Line 1',      'L-H3-L1', TRUE),
  ('70000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000004', 'Packing Bay', 'L-H4-PB', TRUE),
  ('70000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000005', 'Workshop 1',  'L-H5-W1', TRUE),
  ('70000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000006', 'Lab A',       'L-H6-LA', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Sub-categories
INSERT INTO sub_categories (id, category_id, name, code, is_active) VALUES
  ('45000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'Fire Safety',       'SAFETY-FIRE',    TRUE),
  ('45000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Electrical Safety', 'SAFETY-ELEC',    TRUE),
  ('45000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'Defect Reduction',  'QUALITY-DEFECT', TRUE),
  ('45000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'Process Control',   'QUALITY-PROC',   TRUE),
  ('45000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 'Cycle Time',        'PROD-CYCLE',     TRUE),
  ('45000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', 'Cost Reduction',    'PROD-COST',      TRUE)
ON CONFLICT (code) DO NOTHING;

-- SLA configs for all workflow stages
INSERT INTO sla_configs (plant_id, stage_code, workflow_type, sla_hours, reminder_hrs, escalate_to_role, second_esc_hrs, is_active) VALUES
  ('10000000-0000-0000-0000-000000000001', 'ZONE_LEADER_REVIEW', 'IDEA_APPROVAL',           48, 36, 'HOD',        60, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'HOD_REVIEW',         'IDEA_APPROVAL',           48, 36, 'Plant OPEX', 60, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'SAFETY_REVIEW',      'IDEA_APPROVAL',           48, 36, 'HOD',        60, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'QUALITY_REVIEW',     'IDEA_APPROVAL',           48, 36, 'HOD',        60, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'ZONE_LEADER_REVIEW', 'IMPLEMENTATION_APPROVAL', 72, 48, 'HOD',        84, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'HOD_REVIEW',         'IMPLEMENTATION_APPROVAL', 72, 48, 'Plant OPEX', 84, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'SME_REVIEW',         'IMPLEMENTATION_APPROVAL', 72, 48, 'HOD',        96, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'SAFETY_REVIEW',      'IMPLEMENTATION_APPROVAL', 48, 36, 'HOD',        60, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'QUALITY_REVIEW',     'IMPLEMENTATION_APPROVAL', 48, 36, 'HOD',        60, TRUE),
  ('10000000-0000-0000-0000-000000000001', 'SCI_TECH_UPLOAD',    'IMPLEMENTATION_APPROVAL',120, 96, 'Plant OPEX',144, TRUE)
ON CONFLICT (plant_id, stage_code, workflow_type) DO NOTHING;

-- =============================================================================
-- SECTION 2: EXTRA USERS
-- New IDs use valid hex suffix: b, c, d, e
-- =============================================================================

INSERT INTO users (id, employee_id, email, full_name, phone, password_hash, is_active, created_at, updated_at) VALUES
  -- Management Associate (needed for idea T07, T14, T15)
  ('a0000000-0000-0000-0000-000000000008', 'EMP008', 'mgmt@acg.com',       'Deepak Joshi',  '9000000008', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  -- SME
  ('a0000000-0000-0000-0000-000000000009', 'EMP009', 'sme@acg.com',        'Ramesh Iyer',   '9000000009', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  -- SC Member 2 (sc@acg.com = EMP010 already exists as SC member 1)
  ('a0000000-0000-0000-0000-00000000000b', 'EMP011', 'sc2@acg.com',        'Arjun Mehta',   '9000000011', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  -- Zone Leader 2 (Zone B)
  ('a0000000-0000-0000-0000-00000000000c', 'EMP012', 'zoneleader2@acg.com','Neha Joshi',    '9000000012', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW()),
  -- Plant Associate 2
  ('a0000000-0000-0000-0000-00000000000d', 'EMP013', 'associate2@acg.com', 'Sanjay Patil',  '9000000013', '$2b$12$5ditxKBr0eaY2.2SqCeQxO0Nl8FsaQvcraqQNdhuD1GSjg0EkTUT2', TRUE, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Role assignments
INSERT INTO user_roles (user_id, role_id, plant_id, zone_id, department_id, granted_at, granted_by)
SELECT u.id, '00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
       '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', NOW(), 'a0000000-0000-0000-0000-000000000001'
FROM users u WHERE u.email = 'mgmt@acg.com'
ON CONFLICT (user_id, role_id, plant_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, plant_id, zone_id, department_id, granted_at, granted_by)
SELECT u.id, '00000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', NULL, NULL, NOW(), 'a0000000-0000-0000-0000-000000000001'
FROM users u WHERE u.email = 'sme@acg.com'
ON CONFLICT (user_id, role_id, plant_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, plant_id, zone_id, department_id, granted_at, granted_by)
SELECT u.id, '00000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', NULL, NULL, NOW(), 'a0000000-0000-0000-0000-000000000001'
FROM users u WHERE u.email = 'sc2@acg.com'
ON CONFLICT (user_id, role_id, plant_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, plant_id, zone_id, department_id, granted_at, granted_by)
SELECT u.id, '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', NULL, NOW(), 'a0000000-0000-0000-0000-000000000001'
FROM users u WHERE u.email = 'zoneleader2@acg.com'
ON CONFLICT (user_id, role_id, plant_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id, plant_id, zone_id, department_id, granted_at, granted_by)
SELECT u.id, '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', NOW(), 'a0000000-0000-0000-0000-000000000001'
FROM users u WHERE u.email = 'associate2@acg.com'
ON CONFLICT (user_id, role_id, plant_id) DO NOTHING;

-- =============================================================================
-- SECTION 3: IDEAS — every status and scenario
-- =============================================================================

INSERT INTO ideas (
  id, registration_id, submitted_by, plant_id, zone_id, department_id,
  function_id, hall_id, location_id, category_id, sub_category_id,
  title, description, problem_statement, proposed_solution, expected_benefits,
  value_stream, remarks, is_anonymous, is_public_submission,
  status, submitted_at, created_at, updated_at
) VALUES

-- T01: DRAFT — not submitted yet
('b1000000-0000-0000-0000-000000000001', NULL,
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000005',
 'Draft: Reduce setup time on CNC machines',
 'CNC machines take 45 min to set up between shifts.',
 'Excessive CNC machine setup time wastes 45 min per shift change.',
 'Create standardised pre-staged tooling carts for each machine type.',
 'Save 2.25 hours/day of productive machine time.',
 'Capsule Manufacturing','Initial draft — pending HOD review before submission',
 FALSE,FALSE,'DRAFT',NULL,NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days'),

-- T02: SUBMITTED — pending Zone Leader (SLA overdue for testing)
('b1000000-0000-0000-0000-000000000002','TEST-2026-0001',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000001',
 'Leaking hydraulic hose near press machine — fire risk',
 'Press machine no. 4 has a worn hydraulic hose weeping oil near a hot surface.',
 'Hydraulic hose on Press #4 leaks oil near motor housing (temp ~120°C). Risk of oil fire.',
 'Replace hose with high-temp rated braided steel variant. Install drip tray and heat shield.',
 'Eliminate fire risk. Prevent unplanned downtime. Safety audit compliance.',
 'Press Operations','Urgent — flagged during safety walk',
 FALSE,FALSE,'SUBMITTED',NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days'),

-- T03: SUBMITTED — Zone Leader approved, at HOD review
('b1000000-0000-0000-0000-000000000003','TEST-2026-0002',
 'a0000000-0000-0000-0000-00000000000d',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003',
 '60000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000003',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000005',
 'Assembly line: eliminate manual torque recording with digital gauge',
 'Current torque checks are recorded on paper logs prone to transcription errors.',
 'Manual torque recording on 12 assembly stations causes 3-4 data entry errors per shift.',
 'Install Bluetooth digital torque wrenches that auto-log to MES.',
 'Zero torque recording errors. Eliminate 20 min/shift manual data entry.',
 'Assembly Operations',NULL,
 FALSE,FALSE,'SUBMITTED',NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days',NOW()-INTERVAL '6 days'),

-- T04: SUBMITTED — returned to idea owner (Zone Leader returned)
('b1000000-0000-0000-0000-000000000004','TEST-2026-0003',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000002','45000000-0000-0000-0000-000000000003',
 'Control panel wiring colour coding non-standard across 3 machines',
 'Three control panels installed by different contractors use different wire colour standards.',
 'Inconsistent wiring on panels P-12, P-13, P-14 causes confusion during maintenance.',
 'Standardise all three panels to IEC 60446. Create wiring map for each panel.',
 'Reduce troubleshooting time 40%. Prevent incorrect connections during repairs.',
 'Electrical Maintenance',NULL,
 FALSE,FALSE,'SUBMITTED',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days',NOW()-INTERVAL '7 days'),

-- T05: SUBMITTED — HOD approved with Safety+QMS flags, at Safety Review (dynamic step)
('b1000000-0000-0000-0000-000000000005','TEST-2026-0004',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000002',
 'Replace open cable trays with enclosed conduit in wet process area',
 'Open cable trays in wet zone exposed to cleaning water splash causing insulation degradation.',
 'Exposed cables in wet area (Hall A1) show insulation cracking. Short-circuit risk.',
 'Replace all open cable trays with IP67-rated enclosed conduit within 10m wet zone radius.',
 'Eliminate short-circuit risk. Pass safety audit. Extend cable life 5 years.',
 'Utilities','HOD flagged: requires Safety Review + QMS documentation update',
 FALSE,FALSE,'SUBMITTED',NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days'),

-- T06: APPROVED — ready for implementation, no kaizen yet
('b1000000-0000-0000-0000-000000000006','TEST-2026-0005',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003',
 '60000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000003',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000006',
 'Install shadow boards at all 8 workstations in Assembly Hall B1',
 'Tools at workstations are not organised, causing 5-8 min search time per shift.',
 'Disorganised tool storage at Assembly Hall B1 results in 5-8 min wasted per occurrence.',
 'Design and install shadow boards with foam cut-outs for every tool at 8 workstations.',
 'Eliminate tool search time. Instant visual management of missing tools. 5S compliance.',
 'Assembly Operations',NULL,
 FALSE,FALSE,'APPROVED',NOW()-INTERVAL '3 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days'),

-- T07: APPROVED — kaizen PENDING (mark-implemented, One Pager not started) — mgmt associate
('b1000000-0000-0000-0000-000000000007','TEST-2026-0006',
 'a0000000-0000-0000-0000-000000000008',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000002',
 '40000000-0000-0000-0000-000000000002','45000000-0000-0000-0000-000000000004',
 'SPC charts for critical dimension on Capsule Body machine CB-07',
 'Machine CB-07 runs without real-time SPC monitoring.',
 'CB-07 critical bore diameter checked only 4x per shift. Out-of-tolerance parts detected late.',
 'Install real-time SPC chart on operator HMI using existing sensor data feed.',
 'Detect drift within 15 min. Reduce scrap rate 60%.',
 'Capsule Manufacturing',NULL,
 FALSE,FALSE,'APPROVED',NOW()-INTERVAL '2 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '2 days'),

-- T08: APPROVED — kaizen IN_PROGRESS (One Pager draft saved)
('b1000000-0000-0000-0000-000000000008','TEST-2026-0007',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000001',
 'Fire extinguisher inspection register digitalisation',
 'Monthly fire extinguisher checks recorded in paper registers per zone office.',
 'Paper-based fire extinguisher registers not centralised. Missed inspections undetected.',
 'Digital checklist on tablet mounted near each extinguisher cluster. Data syncs to CMMS.',
 'Real-time compliance visibility. Automated overdue alerts. Audit-ready digital records.',
 'Safety Compliance',NULL,
 FALSE,FALSE,'APPROVED',NOW()-INTERVAL '1 day',NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day'),

-- T09: APPROVED — kaizen ONE_PAGER_SUBMITTED (waiting implementation approval)
('b1000000-0000-0000-0000-000000000009','TEST-2026-0008',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000004',
 '60000000-0000-0000-0000-000000000004','70000000-0000-0000-0000-000000000004',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000006',
 'Eliminate double-handling in packaging by redesigning pallet flow',
 'Finished goods manually moved from Line 1 to Packing Bay — 15m double-handling.',
 'Operators manually carry finished goods 15m from production line to packing bay.',
 'Install gravity roller conveyor linking Line 1 exit to Packing Bay entry.',
 'Save 4 min/batch × 120 batches/day = 480 min/day.',
 'Packaging Efficiency',NULL,
 FALSE,FALSE,'APPROVED',NOW()-INTERVAL '12 hours',NOW()-INTERVAL '1 day',NOW()-INTERVAL '12 hours'),

-- T10: APPROVED — kaizen APPROVED, waiting R&R (SMED BM-03)
('b1000000-0000-0000-0000-000000000010','TEST-2026-0009',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000005',
 'Reduce changeover time on Blister Machine BM-03 using SMED',
 'BM-03 changeover takes 3.5 hours. SMED shows 2h can be externalised.',
 'BM-03 format changeover: 3.5h × 4 changes/week = 14h/week lost.',
 'Classify internal vs external setup. Pre-stage all external tasks during run time.',
 'Reduce changeover 3.5h → 1.5h. Recover 8h/week capacity.',
 'Blister Operations',NULL,
 FALSE,FALSE,'APPROVED',NOW()-INTERVAL '20 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '20 days'),

-- T11: REJECTED by HOD
('b1000000-0000-0000-0000-000000000011','TEST-2026-0010',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000006',
 'Replace all 800 fluorescent lights with LED — entire plant',
 'All 800+ fluorescent tube lights across plant could be replaced with LED.',
 'Fluorescent lighting throughout plant is inefficient vs modern LED.',
 'Replace all 800 tubes with LED in a single plant-wide project.',
 'Est. 35% energy saving on lighting. 5-year payback.',
 'Utilities',NULL,
 FALSE,FALSE,'REJECTED',NOW()-INTERVAL '15 days',NOW()-INTERVAL '18 days',NOW()-INTERVAL '15 days'),

-- T12: Anonymous public submission — SUBMITTED, pending Zone Leader
('b1000000-0000-0000-0000-000000000012','TEST-2026-0011',
 NULL,
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000003',
 '60000000-0000-0000-0000-000000000003','70000000-0000-0000-0000-000000000003',
 '40000000-0000-0000-0000-000000000001','45000000-0000-0000-0000-000000000001',
 'Slippery floor near coolant drain in Hall B1 — slip hazard',
 'Coolant overflow from drain near M-22 creates slippery floor conditions.',
 'Coolant overflow near M-22 creates recurring slip hazard. Two near-miss incidents last quarter.',
 'Install drain guard and anti-slip matting. Weekly inspection of coolant levels.',
 'Eliminate slip hazard. Prevent injury. Safety audit compliance.',
 'Coolant Management','Submitted anonymously via QR code',
 TRUE,TRUE,'SUBMITTED',NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days'),

-- T13: APPROVED — kaizen APPROVED + Regular reward
('b1000000-0000-0000-0000-000000000013','TEST-2026-0012',
 'a0000000-0000-0000-0000-000000000002',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000006',
 'Visual management board for daily production targets vs actuals',
 'Production targets only visible on office PC, not shop floor.',
 'Operators cannot see shift production targets vs actuals in real time.',
 'Install A0 visual management board at each line. Update every 2 hours.',
 '3% OEE improvement = ₹8L/year additional output value.',
 'Production Operations',NULL,
 FALSE,FALSE,'APPROVED',NOW()-INTERVAL '30 days',NOW()-INTERVAL '35 days',NOW()-INTERVAL '30 days'),

-- T14: APPROVED — kaizen APPROVED + High Impact nominated, SC ratings pending
('b1000000-0000-0000-0000-000000000014','TEST-2026-0013',
 'a0000000-0000-0000-0000-000000000008',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000006',
 'SMED implementation on Format Change — CB Line 2 (High Impact)',
 'CB Line 2 format change 4.5h/change × 3/week = 13.5h/week lost.',
 'CB Line 2 format change: 4.5h × 3 changes/week = 13.5h/week capacity lost.',
 'Full SMED project: document all steps, classify internal/external, parallelise.',
 'Reduce changeover 4.5h → 1.2h. Recover 9.9h/week = est. ₹18L/year.',
 'Capsule Manufacturing','High impact — nominated by OPEX for SC evaluation',
 FALSE,FALSE,'APPROVED',NOW()-INTERVAL '28 days',NOW()-INTERVAL '32 days',NOW()-INTERVAL '28 days'),

-- T15: APPROVED — kaizen APPROVED + Special award + National winner
('b1000000-0000-0000-0000-000000000015','TEST-2026-0014',
 'a0000000-0000-0000-0000-000000000008',
 '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',
 '30000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000003','45000000-0000-0000-0000-000000000005',
 'Poka-Yoke on Capsule Fill Station — prevents wrong API loading (National Winner)',
 'Wrong API batch loaded 3 times in 18 months. Each incident: 4h stoppage + rework.',
 'Incorrect API loading caused 3 critical quality incidents in 18 months.',
 'Barcode-scanning poka-yoke: machine cannot start unless scanned batch matches recipe.',
 'Zero wrong-API incidents. Prevent ₹25L avg rework. QMS compliance.',
 'Capsule Filling','National award winner — inter-plant competition 2025',
 FALSE,FALSE,'APPROVED',NOW()-INTERVAL '90 days',NOW()-INTERVAL '95 days',NOW()-INTERVAL '90 days')

ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 4: WORKFLOW INSTANCES
-- =============================================================================

INSERT INTO workflow_instances (id, template_id, entity_type, entity_id, workflow_type, current_stage, current_status, initiated_by, initiated_at, completed_at, created_at, updated_at) VALUES
('c1000000-0000-0000-0000-000000000002','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000002','IDEA_APPROVAL','ZONE_LEADER_REVIEW','IN_PROGRESS','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '8 days',NULL,NOW()-INTERVAL '8 days',NOW()-INTERVAL '8 days'),
('c1000000-0000-0000-0000-000000000003','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000003','IDEA_APPROVAL','HOD_REVIEW','IN_PROGRESS','a0000000-0000-0000-0000-00000000000d',NOW()-INTERVAL '6 days',NULL,NOW()-INTERVAL '6 days',NOW()-INTERVAL '5 days'),
('c1000000-0000-0000-0000-000000000004','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000004','IDEA_APPROVAL','ZONE_LEADER_REVIEW','RETURNED','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '7 days',NULL,NOW()-INTERVAL '7 days',NOW()-INTERVAL '6 days'),
('c1000000-0000-0000-0000-000000000005','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000005','IDEA_APPROVAL','SAFETY_REVIEW','IN_PROGRESS','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '5 days',NULL,NOW()-INTERVAL '5 days',NOW()-INTERVAL '3 days'),
('c1000000-0000-0000-0000-000000000006','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000006','IDEA_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '3 days'),
('c1000000-0000-0000-0000-000000000007','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000007','IDEA_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000008',NOW()-INTERVAL '3 days',NOW()-INTERVAL '2 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '2 days'),
('c1000000-0000-0000-0000-000000000008','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000008','IDEA_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day',NOW()-INTERVAL '2 days',NOW()-INTERVAL '1 day'),
('c1000000-0000-0000-0000-000000000009','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000009','IDEA_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '1 day',NOW()-INTERVAL '12 hours',NOW()-INTERVAL '1 day',NOW()-INTERVAL '12 hours'),
('c1000000-0000-0000-0000-000000000010','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000010','IDEA_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '25 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '20 days'),
('c1000000-0000-0000-0000-000000000011','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000011','IDEA_APPROVAL','HOD_REVIEW','REJECTED','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '18 days',NOW()-INTERVAL '15 days',NOW()-INTERVAL '18 days',NOW()-INTERVAL '15 days'),
('c1000000-0000-0000-0000-000000000012','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000012','IDEA_APPROVAL','ZONE_LEADER_REVIEW','IN_PROGRESS',NULL,NOW()-INTERVAL '4 days',NULL,NOW()-INTERVAL '4 days',NOW()-INTERVAL '4 days'),
('c1000000-0000-0000-0000-000000000013','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000013','IDEA_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '35 days',NOW()-INTERVAL '30 days',NOW()-INTERVAL '35 days',NOW()-INTERVAL '30 days'),
('c1000000-0000-0000-0000-000000000014','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000014','IDEA_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000008',NOW()-INTERVAL '32 days',NOW()-INTERVAL '28 days',NOW()-INTERVAL '32 days',NOW()-INTERVAL '28 days'),
('c1000000-0000-0000-0000-000000000015','00000000-0000-0000-0002-000000000001','idea','b1000000-0000-0000-0000-000000000015','IDEA_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000008',NOW()-INTERVAL '95 days',NOW()-INTERVAL '90 days',NOW()-INTERVAL '95 days',NOW()-INTERVAL '90 days')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 5: WORKFLOW STEPS (idea workflows)
-- =============================================================================

INSERT INTO workflow_steps (id, workflow_instance_id, step_order, stage_code, assigned_user_id, status, comment, action_taken_at, action_assigned_at, sla_due_at, escalated, is_dynamic) VALUES
-- T02: step 1 PENDING Zone Leader (overdue)
('d1000000-0000-0000-0000-000000000021','c1000000-0000-0000-0000-000000000002',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','PENDING',NULL,NULL,NOW()-INTERVAL '8 days',NOW()-INTERVAL '2 days',TRUE,FALSE),
('d1000000-0000-0000-0000-000000000022','c1000000-0000-0000-0000-000000000002',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','PENDING',NULL,NULL,NULL,NULL,FALSE,FALSE),
-- T03: step 1 APPROVED, step 2 PENDING HOD
('d1000000-0000-0000-0000-000000000031','c1000000-0000-0000-0000-000000000003',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Idea is feasible and well-described. Proceeding to HOD.',NOW()-INTERVAL '5 days',NOW()-INTERVAL '6 days',NOW()-INTERVAL '4 days',FALSE,FALSE),
('d1000000-0000-0000-0000-000000000032','c1000000-0000-0000-0000-000000000003',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','PENDING',NULL,NULL,NOW()-INTERVAL '5 days',NOW()-INTERVAL '3 days',FALSE,FALSE),
-- T04: step 1 RETURNED
('d1000000-0000-0000-0000-000000000041','c1000000-0000-0000-0000-000000000004',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','RETURNED','Please provide specific machine tag numbers for P-12, P-13, P-14 and attach a photo of current wiring.',NOW()-INTERVAL '6 days',NOW()-INTERVAL '7 days',NOW()-INTERVAL '5 days',FALSE,FALSE),
-- T05: step 1 APPROVED, step 2 APPROVED with flags, step 3 PENDING Safety, step 4 PENDING Quality
('d1000000-0000-0000-0000-000000000051','c1000000-0000-0000-0000-000000000005',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Safety concern confirmed. Good catch.',NOW()-INTERVAL '4 days',NOW()-INTERVAL '5 days',NOW()-INTERVAL '3 days',FALSE,FALSE),
('d1000000-0000-0000-0000-000000000052','c1000000-0000-0000-0000-000000000005',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. Safety review and QMS update required before implementation.',NOW()-INTERVAL '3 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '2 days',FALSE,FALSE),
('d1000000-0000-0000-0000-000000000053','c1000000-0000-0000-0000-000000000005',3,'SAFETY_REVIEW','a0000000-0000-0000-0000-000000000006','PENDING',NULL,NULL,NOW()-INTERVAL '3 days',NOW()-INTERVAL '1 day',FALSE,TRUE),
('d1000000-0000-0000-0000-000000000054','c1000000-0000-0000-0000-000000000005',4,'QUALITY_REVIEW','a0000000-0000-0000-0000-000000000007','PENDING',NULL,NULL,NULL,NULL,FALSE,TRUE),
-- T06: fully approved
('d1000000-0000-0000-0000-000000000061','c1000000-0000-0000-0000-000000000006',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Simple improvement, fully feasible.',NOW()-INTERVAL '3 days',NOW()-INTERVAL '4 days',NOW()-INTERVAL '2 days',FALSE,FALSE),
('d1000000-0000-0000-0000-000000000062','c1000000-0000-0000-0000-000000000006',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Good 5S idea. Budget approved. Proceed.',NOW()-INTERVAL '3 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '1 day',FALSE,FALSE),
-- T07: fully approved
('d1000000-0000-0000-0000-000000000071','c1000000-0000-0000-0000-000000000007',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','SPC monitoring is needed here.',NOW()-INTERVAL '2 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '1 day',FALSE,FALSE),
('d1000000-0000-0000-0000-000000000072','c1000000-0000-0000-0000-000000000007',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. Assign to Deepak for implementation.',NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days',NOW()-INTERVAL '12 hours',FALSE,FALSE),
-- T08: fully approved
('d1000000-0000-0000-0000-000000000081','c1000000-0000-0000-0000-000000000008',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Fire safety digitalisation is overdue.',NOW()-INTERVAL '1 day',NOW()-INTERVAL '2 days',NOW(),FALSE,FALSE),
('d1000000-0000-0000-0000-000000000082','c1000000-0000-0000-0000-000000000008',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. EHS team to assist.',NOW()-INTERVAL '1 day',NOW()-INTERVAL '1 day',NOW()+INTERVAL '1 day',FALSE,FALSE),
-- T09: fully approved
('d1000000-0000-0000-0000-000000000091','c1000000-0000-0000-0000-000000000009',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Conveyor install is straightforward.',NOW()-INTERVAL '12 hours',NOW()-INTERVAL '1 day',NOW(),FALSE,FALSE),
('d1000000-0000-0000-0000-000000000092','c1000000-0000-0000-0000-000000000009',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. Good ROI.',NOW()-INTERVAL '12 hours',NOW()-INTERVAL '12 hours',NOW()+INTERVAL '1 day',FALSE,FALSE),
-- T10: fully approved
('d1000000-0000-0000-0000-0000000000a1','c1000000-0000-0000-0000-000000000010',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','SMED study done. Implementation straightforward.',NOW()-INTERVAL '22 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '23 days',FALSE,FALSE),
('d1000000-0000-0000-0000-0000000000a2','c1000000-0000-0000-0000-000000000010',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. High-value productivity improvement.',NOW()-INTERVAL '20 days',NOW()-INTERVAL '22 days',NOW()-INTERVAL '21 days',FALSE,FALSE),
-- T11: rejected at HOD
('d1000000-0000-0000-0000-0000000000b1','c1000000-0000-0000-0000-000000000011',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Good idea but scope may be too large.',NOW()-INTERVAL '17 days',NOW()-INTERVAL '18 days',NOW()-INTERVAL '16 days',FALSE,FALSE),
('d1000000-0000-0000-0000-0000000000b2','c1000000-0000-0000-0000-000000000011',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','REJECTED','Scope too large for Kaizen. Must go through CAPEX approval. Resubmit as scoped pilot on one section.',NOW()-INTERVAL '15 days',NOW()-INTERVAL '17 days',NOW()-INTERVAL '15 days',FALSE,FALSE),
-- T12: anon pending Zone Leader
('d1000000-0000-0000-0000-0000000000c1','c1000000-0000-0000-0000-000000000012',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','PENDING',NULL,NULL,NOW()-INTERVAL '4 days',NOW()-INTERVAL '2 days',FALSE,FALSE),
('d1000000-0000-0000-0000-0000000000c2','c1000000-0000-0000-0000-000000000012',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','PENDING',NULL,NULL,NULL,NULL,FALSE,FALSE),
-- T13–T15: all approved
('d1000000-0000-0000-0000-0000000000d1','c1000000-0000-0000-0000-000000000013',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Good idea.',NOW()-INTERVAL '33 days',NOW()-INTERVAL '35 days',NOW()-INTERVAL '33 days',FALSE,FALSE),
('d1000000-0000-0000-0000-0000000000d2','c1000000-0000-0000-0000-000000000013',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved.',NOW()-INTERVAL '30 days',NOW()-INTERVAL '33 days',NOW()-INTERVAL '31 days',FALSE,FALSE),
('d1000000-0000-0000-0000-0000000000e1','c1000000-0000-0000-0000-000000000014',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','High value SMED implementation.',NOW()-INTERVAL '30 days',NOW()-INTERVAL '32 days',NOW()-INTERVAL '30 days',FALSE,FALSE),
('d1000000-0000-0000-0000-0000000000e2','c1000000-0000-0000-0000-000000000014',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. Nominate for high impact after completion.',NOW()-INTERVAL '28 days',NOW()-INTERVAL '30 days',NOW()-INTERVAL '28 days',FALSE,FALSE),
('d1000000-0000-0000-0000-0000000000f1','c1000000-0000-0000-0000-000000000015',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Critical safety and quality improvement.',NOW()-INTERVAL '93 days',NOW()-INTERVAL '95 days',NOW()-INTERVAL '93 days',FALSE,FALSE),
('d1000000-0000-0000-0000-0000000000f2','c1000000-0000-0000-0000-000000000015',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. Exceptional improvement with direct quality impact.',NOW()-INTERVAL '90 days',NOW()-INTERVAL '93 days',NOW()-INTERVAL '91 days',FALSE,FALSE)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 6: WORKFLOW FLAGS (T05 — Safety + QMS)
-- =============================================================================

INSERT INTO workflow_flags (id, workflow_instance_id, machine_design_change, safety_review_required, qms_review_required, sci_tech_required, set_by_user_id, set_at) VALUES
  ('df000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000005',FALSE,TRUE,TRUE,FALSE,'a0000000-0000-0000-0000-000000000004',NOW()-INTERVAL '3 days')
ON CONFLICT (workflow_instance_id) DO NOTHING;

-- =============================================================================
-- SECTION 7: KAIZENS — every One Pager status
-- Columns: id, kaizen_id, idea_id, implementation_owner, assigned_by,
--          title, status,
--          before_description, after_description, benefits_achieved,
--          cost_savings, productivity_gain, quality_improvement, safety_improvement,
--          implementation_date,
--          team_members, business_impact,
--          w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how,
--          why_1, why_2, why_3, why_4, why_5,
--          root_cause_analysis, category_of_cause,
--          solution_implemented, results, cost, benefit,
--          early_equipment_mgmt, applicable_documents, remarks,
--          one_pager_submitted_at, created_at, updated_at
-- =============================================================================

-- KZ-T07: PENDING (mark-implemented done, One Pager not started)
INSERT INTO kaizens (id, kaizen_id, idea_id, implementation_owner, assigned_by, title, status, before_description, after_description, benefits_achieved, cost_savings, productivity_gain, quality_improvement, safety_improvement, implementation_date, team_members, business_impact, w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how, why_1, why_2, why_3, why_4, why_5, root_cause_analysis, category_of_cause, solution_implemented, results, cost, benefit, early_equipment_mgmt, applicable_documents, remarks, one_pager_submitted_at, created_at, updated_at)
VALUES ('f1000000-0000-0000-0000-000000000007','KZ-NSK-26-0001','b1000000-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000005','SPC charts for critical dimension on Capsule Body machine CB-07','PENDING',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,FALSE,NULL,NULL,NULL,NOW()-INTERVAL '2 days',NOW()-INTERVAL '2 days')
ON CONFLICT (idea_id) DO NOTHING;

-- KZ-T08: IN_PROGRESS (One Pager draft in progress)
INSERT INTO kaizens (id, kaizen_id, idea_id, implementation_owner, assigned_by, title, status, before_description, after_description, benefits_achieved, cost_savings, productivity_gain, quality_improvement, safety_improvement, implementation_date, team_members, business_impact, w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how, why_1, why_2, why_3, why_4, why_5, root_cause_analysis, category_of_cause, solution_implemented, results, cost, benefit, early_equipment_mgmt, applicable_documents, remarks, one_pager_submitted_at, created_at, updated_at)
VALUES ('f1000000-0000-0000-0000-000000000008','KZ-NSK-26-0002','b1000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000005','Fire extinguisher inspection register digitalisation','IN_PROGRESS','Paper registers in each zone office. Manual monthly check, no alerts, no central view.','Digital checklist on wall-mounted tablets. Real-time sync to safety dashboard.',NULL,NULL,NULL,NULL,'Improved fire safety compliance visibility','2026-10-28','Raj Kumar, EHS Team, IT Support','Safety Compliance','EHS team and Zone leaders','Monthly fire extinguisher inspection','All zones — Halls A1 A2 B1 B2','Monthly','Paper records not centralised, no overdue alerts','Install Android tablets with checklist app, integrate with CMMS','Paper-based system has no alert mechanism','Zone leaders do not have real-time visibility','IT system not extended to shop floor previously','No budget for digital safety tools in prior year',NULL,'Root cause: No digital infrastructure for safety compliance tracking at zone level.','Method',NULL,NULL,NULL,NULL,FALSE,NULL,'Draft saved — solution and results pending completion',NULL,NOW()-INTERVAL '1 day',NOW()-INTERVAL '6 hours')
ON CONFLICT (idea_id) DO NOTHING;

-- KZ-T09: ONE_PAGER_SUBMITTED (waiting implementation approval)
INSERT INTO kaizens (id, kaizen_id, idea_id, implementation_owner, assigned_by, title, status, before_description, after_description, benefits_achieved, cost_savings, productivity_gain, quality_improvement, safety_improvement, implementation_date, team_members, business_impact, w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how, why_1, why_2, why_3, why_4, why_5, root_cause_analysis, category_of_cause, solution_implemented, results, cost, benefit, early_equipment_mgmt, applicable_documents, remarks, one_pager_submitted_at, created_at, updated_at)
VALUES ('f1000000-0000-0000-0000-000000000009','KZ-NSK-26-0003','b1000000-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000005','Eliminate double-handling in packaging by redesigning pallet flow','ONE_PAGER_SUBMITTED','Operators manually carry finished goods 15m from Line 1 to Packing Bay. 4 min per batch, 120 batches/day = 480 min/day wasted.','Gravity roller conveyor installed between Line 1 exit and Packing Bay. Batches self-flow in 20 seconds.','Eliminated 480 min/day manual carry. Operator fatigue reduced.',150000.00,'480 min/day = 8 hrs/day operator time recovered',NULL,NULL,'2026-10-25','Raj Kumar (Lead), Maintenance Team, Production Supervisor','Productivity — direct labour saving 8 hrs/day','Production operators and Zone Leader','Manual carry of finished goods from Line 1 to Packing Bay','Assembly Hall B1 to Packing Bay (15m path)','Every batch — 120 times per day','Layout did not include material flow path','Installed 15m gravity roller conveyor with guide rails','No conveyor existed between Line 1 and Packing Bay at plant layout','Layout optimised for equipment, not material flow','Material flow analysis not done during plant commissioning','No capital budget for material handling improvements until this year',NULL,'Root cause: Plant layout designed without material flow analysis.','Machine','Installed 15m gravity roller conveyor (3-inch rollers, 500kg capacity). Guide rails on both sides.','Batch transport: 4 min → 20 sec. Operator effort: 0. Zero product damage in 30 days post-install.',85000.00,150000.00,FALSE,'Conveyor installation drawings, before/after video',NULL,NOW()-INTERVAL '12 hours',NOW()-INTERVAL '1 day',NOW()-INTERVAL '12 hours')
ON CONFLICT (idea_id) DO NOTHING;

-- KZ-T10: APPROVED (fully done, waiting R&R — SMED BM-03)
INSERT INTO kaizens (id, kaizen_id, idea_id, implementation_owner, assigned_by, title, status, before_description, after_description, benefits_achieved, cost_savings, productivity_gain, quality_improvement, safety_improvement, implementation_date, team_members, business_impact, w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how, why_1, why_2, why_3, why_4, why_5, root_cause_analysis, category_of_cause, solution_implemented, results, cost, benefit, early_equipment_mgmt, applicable_documents, remarks, one_pager_submitted_at, created_at, updated_at)
VALUES ('f1000000-0000-0000-0000-000000000010','KZ-NSK-26-0004','b1000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000005','Reduce changeover time on Blister Machine BM-03 using SMED','APPROVED','BM-03 format changeover 3.5h. 18 steps identified, 11 internal including tasks doable while machine runs.','External tasks pre-staged during run. Internal steps standardised with quick-release clamps. Changeover now 1.5h.','Recovered 8h/week capacity = 416 hours/year.',520000.00,'8 hrs/week = 416 hrs/year additional capacity',NULL,NULL,'2026-09-20','Raj Kumar (Lead), Priya Sharma, Maintenance Team','Productivity — ₹52L/year revenue capacity recovered','Production team and maintenance','BM-03 format changeover','Blister Machine BM-03 Hall A1','Every format change (avg 4×/week)','All changeover treated as internal causing unnecessary downtime','Documented all 18 steps. Reclassified 7 external. Installed quick-release clamps.','External tasks performed while machine was stopped','No pre-staging of tooling before changeover','No quick-release clamps — required tool-based fastening','No standardised changeover procedure documented','SMED methodology not previously applied to this machine','Root cause: All changeover tasks treated as internal. No SMED analysis performed on BM-03.','Method','Documented all 18 changeover steps. Reclassified 7 external. Installed quick-release clamps on 4 fixtures. Created standardised setup cart.','Changeover reduced 3.5h → 1.5h. Validated over 12 consecutive changes. Variance ±8 min.',125000.00,520000.00,FALSE,'SMED study report, before/after video, timing sheets, SOP',NULL,NOW()-INTERVAL '18 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '15 days')
ON CONFLICT (idea_id) DO NOTHING;

-- KZ-T13: APPROVED — Regular reward received
INSERT INTO kaizens (id, kaizen_id, idea_id, implementation_owner, assigned_by, title, status, before_description, after_description, benefits_achieved, cost_savings, productivity_gain, quality_improvement, safety_improvement, implementation_date, team_members, business_impact, w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how, why_1, why_2, why_3, why_4, why_5, root_cause_analysis, category_of_cause, solution_implemented, results, cost, benefit, early_equipment_mgmt, applicable_documents, remarks, one_pager_submitted_at, created_at, updated_at)
VALUES ('f1000000-0000-0000-0000-000000000013','KZ-NSK-26-0005','b1000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000005','Visual management board for daily production targets vs actuals','APPROVED','Production targets and actuals visible only on office PC. Operators unaware of shift pace.','A0 visual management boards installed at each of 4 line entry points. Updated every 2 hours.','Operator production awareness improved. Shift end catch-up actions initiated 2h earlier. OEE improved 3%.',80000.00,'3% OEE improvement = ₹8L/year additional output value',NULL,NULL,'2026-09-05','Raj Kumar, Shift Supervisors, Production Manager','Productivity — improved operator engagement','Shift supervisors','Manual board update','Assembly Hall B1 4 production lines','Every 2 hours per shift','No visual feedback mechanism at shop floor level','Installed A0 boards, created update SOP','Targets existed in system but not displayed at point of work','No visual management standard','Budget for boards not allocated','No formal 5S visual management program',NULL,'Root cause: Targets not communicated visually at point of work.','Management','Installed 4× A0 acrylic-framed boards with magnetic target/actual rows. SOP for 2-hourly update.','Operators aware of pace. 3% OEE gain confirmed over 60 days.',45000.00,80000.00,FALSE,'Board design drawings, OEE trend data',NULL,NOW()-INTERVAL '28 days',NOW()-INTERVAL '30 days',NOW()-INTERVAL '25 days')
ON CONFLICT (idea_id) DO NOTHING;

-- KZ-T14: APPROVED — High Impact nominated (SC ratings in progress)
INSERT INTO kaizens (id, kaizen_id, idea_id, implementation_owner, assigned_by, title, status, before_description, after_description, benefits_achieved, cost_savings, productivity_gain, quality_improvement, safety_improvement, implementation_date, team_members, business_impact, w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how, why_1, why_2, why_3, why_4, why_5, root_cause_analysis, category_of_cause, solution_implemented, results, cost, benefit, early_equipment_mgmt, applicable_documents, remarks, one_pager_submitted_at, created_at, updated_at)
VALUES ('f1000000-0000-0000-0000-000000000014','KZ-NSK-26-0006','b1000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000005','SMED implementation on Format Change — CB Line 2 (High Impact)','APPROVED','CB Line 2 format change: 4.5h/change × 3 changes/week = 13.5h/week of machine downtime.','After SMED: changeover 1.2h. External tasks pre-staged. Parallel internal steps.','Recovered 9.9h/week = 514h/year productive capacity. Est. ₹18L/year additional revenue.',650000.00,'9.9h/week = 514h/year capacity recovered','Zero format-related quality rejects since SMED',NULL,'2026-09-15','Deepak Joshi (Lead), Priya Sharma, Maintenance, Quality Team','High Impact — ₹65L/year revenue capacity + zero format rejects','Production and maintenance','CB Line 2 format changeover','CB Line 2 Hall A1','3 times per week','No SMED analysis on CB Line 2','Full SMED: documented 22 steps, reclassified 9 external, built pre-staging trolley','All changeover treated as internal','No pre-staging fixture available','Changeover SOP not documented','No cross-functional SMED team formed previously',NULL,'Root cause: SMED methodology not applied. All setup treated as internal time.','Method','Full SMED study. Pre-staging trolley built. 2-person parallelised changeover. Video SOP created.','Changeover: 4.5h → 1.2h. Validated 8 consecutive changes. Zero defects first 30 days post-SMED.',180000.00,650000.00,FALSE,'SMED study, video SOP, timing data, quality records',NULL,NOW()-INTERVAL '22 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '20 days')
ON CONFLICT (idea_id) DO NOTHING;

-- KZ-T15: APPROVED — Special R&R + National Inter-Plant winner
INSERT INTO kaizens (id, kaizen_id, idea_id, implementation_owner, assigned_by, title, status, before_description, after_description, benefits_achieved, cost_savings, productivity_gain, quality_improvement, safety_improvement, implementation_date, team_members, business_impact, w1h_who, w1h_what, w1h_where, w1h_when, w1h_why, w1h_how, why_1, why_2, why_3, why_4, why_5, root_cause_analysis, category_of_cause, solution_implemented, results, cost, benefit, early_equipment_mgmt, applicable_documents, remarks, one_pager_submitted_at, created_at, updated_at)
VALUES ('f1000000-0000-0000-0000-000000000015','KZ-NSK-26-0007','b1000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000005','Poka-Yoke on Capsule Fill Station — prevents wrong API loading','APPROVED','3 wrong-API-loading incidents in 18 months. Each: 4h stoppage, batch rejection, rework. Avg cost ₹25L.','Barcode-scanning poka-yoke installed. Machine cannot start unless scanned batch matches recipe in MES.','Zero wrong-API incidents in 12 months. ₹75L rework cost avoided. QMS major finding closed.',750000.00,NULL,'Zero batch rejection due to wrong API in 12 months','Eliminated major quality risk','2025-09-01','Deepak Joshi (Lead), Quality Team, IT/MES Team, Production','Critical Quality + Safety — ₹75L rework savings + QMS compliance','Production and quality teams','Wrong API loading on capsule fill stations','All 4 capsule fill stations Hall A2','During every batch changeover','No interlock between batch record and machine start','MES batch data not connected to machine HMI','No barcode verification step in SOP','API batches in similar packaging by 2 suppliers','IT integration between MES and machine PLC not implemented',NULL,NULL,'Root cause: No automated cross-check between batch record (MES) and physical batch. Visual check only.','Machine','Integrated MES API with machine PLC via OPC-UA. Barcode scanner at each fill station. Machine start interlocked with batch scan confirmation.','Zero wrong-API incidents in 12 months (vs. 3 in prior 18 months). QMS finding closed. Replication recommended at Pune plant.',380000.00,750000.00,TRUE,'PLC integration spec, MES API documentation, validation protocol, QMS closure evidence','National Kaizen Competition 2025 Winner — ACG Group',NOW()-INTERVAL '85 days',NOW()-INTERVAL '88 days',NOW()-INTERVAL '80 days')
ON CONFLICT (idea_id) DO NOTHING;

-- =============================================================================
-- SECTION 8: IMPLEMENTATION WORKFLOW INSTANCES + STEPS
-- =============================================================================

INSERT INTO workflow_instances (id, template_id, entity_type, entity_id, workflow_type, current_stage, current_status, initiated_by, initiated_at, completed_at, created_at, updated_at) VALUES
('c2000000-0000-0000-0000-000000000009','00000000-0000-0000-0002-000000000002','kaizen','f1000000-0000-0000-0000-000000000009','IMPLEMENTATION_APPROVAL','ZONE_LEADER_REVIEW','IN_PROGRESS','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '12 hours',NULL,NOW()-INTERVAL '12 hours',NOW()-INTERVAL '12 hours'),
('c2000000-0000-0000-0000-000000000010','00000000-0000-0000-0002-000000000002','kaizen','f1000000-0000-0000-0000-000000000010','IMPLEMENTATION_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000003',NOW()-INTERVAL '20 days',NOW()-INTERVAL '15 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '15 days'),
('c2000000-0000-0000-0000-000000000013','00000000-0000-0000-0002-000000000002','kaizen','f1000000-0000-0000-0000-000000000013','IMPLEMENTATION_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000002',NOW()-INTERVAL '30 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '30 days',NOW()-INTERVAL '25 days'),
('c2000000-0000-0000-0000-000000000014','00000000-0000-0000-0002-000000000002','kaizen','f1000000-0000-0000-0000-000000000014','IMPLEMENTATION_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000008',NOW()-INTERVAL '25 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '20 days'),
('c2000000-0000-0000-0000-000000000015','00000000-0000-0000-0002-000000000002','kaizen','f1000000-0000-0000-0000-000000000015','IMPLEMENTATION_APPROVAL','COMPLETED','COMPLETED','a0000000-0000-0000-0000-000000000008',NOW()-INTERVAL '88 days',NOW()-INTERVAL '80 days',NOW()-INTERVAL '88 days',NOW()-INTERVAL '80 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO workflow_steps (id, workflow_instance_id, step_order, stage_code, assigned_user_id, status, comment, action_taken_at, action_assigned_at, sla_due_at, escalated, is_dynamic) VALUES
-- KZ-T09: step 1 PENDING Zone Leader
('d2000000-0000-0000-0000-000000000091','c2000000-0000-0000-0000-000000000009',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','PENDING',NULL,NULL,NOW()-INTERVAL '12 hours',NOW()+INTERVAL '60 hours',FALSE,FALSE),
('d2000000-0000-0000-0000-000000000092','c2000000-0000-0000-0000-000000000009',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','PENDING',NULL,NULL,NULL,NULL,FALSE,FALSE),
-- KZ-T10: both approved
('d2000000-0000-0000-0000-0000000000a1','c2000000-0000-0000-0000-000000000010',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','One pager is complete and well documented.',NOW()-INTERVAL '18 days',NOW()-INTERVAL '20 days',NOW()-INTERVAL '17 days',FALSE,FALSE),
('d2000000-0000-0000-0000-0000000000a2','c2000000-0000-0000-0000-000000000010',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Excellent documentation. Results verified. Kaizen approved.',NOW()-INTERVAL '15 days',NOW()-INTERVAL '18 days',NOW()-INTERVAL '16 days',FALSE,FALSE),
-- KZ-T13: both approved
('d2000000-0000-0000-0000-0000000000d1','c2000000-0000-0000-0000-000000000013',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Good kaizen.',NOW()-INTERVAL '27 days',NOW()-INTERVAL '30 days',NOW()-INTERVAL '28 days',FALSE,FALSE),
('d2000000-0000-0000-0000-0000000000d2','c2000000-0000-0000-0000-000000000013',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. Assign regular reward.',NOW()-INTERVAL '25 days',NOW()-INTERVAL '27 days',NOW()-INTERVAL '25 days',FALSE,FALSE),
-- KZ-T14: both approved
('d2000000-0000-0000-0000-0000000000e1','c2000000-0000-0000-0000-000000000014',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','High impact, thorough documentation.',NOW()-INTERVAL '22 days',NOW()-INTERVAL '25 days',NOW()-INTERVAL '23 days',FALSE,FALSE),
('d2000000-0000-0000-0000-0000000000e2','c2000000-0000-0000-0000-000000000014',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Approved. Nominate for high impact.',NOW()-INTERVAL '20 days',NOW()-INTERVAL '22 days',NOW()-INTERVAL '21 days',FALSE,FALSE),
-- KZ-T15: both approved
('d2000000-0000-0000-0000-0000000000f1','c2000000-0000-0000-0000-000000000015',1,'ZONE_LEADER_REVIEW','a0000000-0000-0000-0000-000000000003','APPROVED','Outstanding safety and quality improvement.',NOW()-INTERVAL '86 days',NOW()-INTERVAL '88 days',NOW()-INTERVAL '85 days',FALSE,FALSE),
('d2000000-0000-0000-0000-0000000000f2','c2000000-0000-0000-0000-000000000015',2,'HOD_REVIEW','a0000000-0000-0000-0000-000000000004','APPROVED','Exceptional. Submit for national competition.',NOW()-INTERVAL '80 days',NOW()-INTERVAL '86 days',NOW()-INTERVAL '84 days',FALSE,FALSE)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- SECTION 9: REWARDS
-- =============================================================================

INSERT INTO rewards (kaizen_id, assigned_by, reward_type, reward_amount, reward_details, assigned_at) VALUES
  ('f1000000-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000005','REGULAR',2500.00,'Certificate of Appreciation + ₹2,500 gift voucher for excellent 5S visual management improvement.',NOW()-INTERVAL '22 days'),
  ('f1000000-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000005','REGULAR',2500.00,'Certificate of Appreciation + ₹2,500 gift voucher for SMED improvement on BM-03.',NOW()-INTERVAL '12 days'),
  ('f1000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-000000000005','SPECIAL',25000.00,'Special Award — High Impact Kaizen of the Year 2025. ₹25,000 cash prize + Trophy.',NOW()-INTERVAL '60 days');

-- =============================================================================
-- SECTION 10: HIGH IMPACT NOMINATIONS + SC RATINGS
-- =============================================================================

-- T14: PENDING_RATINGS (SC1 rated, SC2 pending)
INSERT INTO high_impact_nominations (id, kaizen_id, nominated_by, nomination_status, nominated_at) VALUES
  ('e1000000-0000-0000-0000-000000000014','f1000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000005','PENDING_RATINGS',NOW()-INTERVAL '18 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sc_ratings (nomination_id, sc_member_id, rating_score, rating_notes, has_rated, rated_at) VALUES
  ('e1000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-00000000000a',8.5,'Excellent SMED work. Very good documentation. Recommend for special award.',TRUE,NOW()-INTERVAL '15 days'),
  ('e1000000-0000-0000-0000-000000000014','a0000000-0000-0000-0000-00000000000b',NULL,NULL,FALSE,NULL)
ON CONFLICT (nomination_id, sc_member_id) DO NOTHING;

-- T15: NOMINATED_INTER_PLANT (all SC members rated)
INSERT INTO high_impact_nominations (id, kaizen_id, nominated_by, nomination_status, nominated_at) VALUES
  ('e1000000-0000-0000-0000-000000000015','f1000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-000000000005','NOMINATED_INTER_PLANT',NOW()-INTERVAL '75 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sc_ratings (nomination_id, sc_member_id, rating_score, rating_notes, has_rated, rated_at) VALUES
  ('e1000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-00000000000a',9.8,'World-class poka-yoke. Zero defects 12 months. Clear ROI. Strong national competition candidate.',TRUE,NOW()-INTERVAL '72 days'),
  ('e1000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-00000000000b',9.5,'Outstanding. MES integration technically excellent. Zero wrong-API incidents validates effectiveness.',TRUE,NOW()-INTERVAL '71 days')
ON CONFLICT (nomination_id, sc_member_id) DO NOTHING;

-- =============================================================================
-- SECTION 11: INTER-PLANT NOMINATION (T15 — National Winner)
-- =============================================================================

INSERT INTO inter_plant_nominations (kaizen_id, nomination_id, nominated_by, competition_year, competition_round, result, nominated_at) VALUES
  ('f1000000-0000-0000-0000-000000000015','e1000000-0000-0000-0000-000000000015','a0000000-0000-0000-0000-000000000005',2025,'NATIONAL','WON',NOW()-INTERVAL '70 days');

-- =============================================================================
-- SECTION 12: NOTIFICATIONS — every notification_type
-- =============================================================================

INSERT INTO notifications (recipient_id, notification_type, title, body, entity_type, entity_id, is_read, read_at, created_at) VALUES
('a0000000-0000-0000-0000-000000000002','IDEA_SUBMITTED','Your idea has been received','Your idea "Leaking hydraulic hose near press machine" (TEST-2026-0001) has been submitted and sent for Zone Leader review.','idea','b1000000-0000-0000-0000-000000000002',TRUE,NOW()-INTERVAL '7 days',NOW()-INTERVAL '8 days'),
('a0000000-0000-0000-0000-000000000003','STEP_ASSIGNED','New idea assigned for your review','Idea TEST-2026-0001 "Leaking hydraulic hose near press machine" has been assigned to you for Zone Leader review. SLA: 48 hours.','idea','b1000000-0000-0000-0000-000000000002',FALSE,NULL,NOW()-INTERVAL '8 days'),
('a0000000-0000-0000-0000-000000000004','STEP_ASSIGNED','Idea approved by Zone Leader — your review required','Idea TEST-2026-0002 "Assembly line: eliminate manual torque recording" approved by Zone Leader. Pending your HOD review.','idea','b1000000-0000-0000-0000-000000000003',FALSE,NULL,NOW()-INTERVAL '5 days'),
('a0000000-0000-0000-0000-000000000002','STEP_RETURNED','Your idea was returned for more information','Your idea TEST-2026-0003 was returned by Zone Leader: "Please provide machine tag numbers for P-12, P-13, P-14 and attach wiring photo."','idea','b1000000-0000-0000-0000-000000000004',TRUE,NOW()-INTERVAL '5 days',NOW()-INTERVAL '6 days'),
('a0000000-0000-0000-0000-000000000002','IDEA_APPROVED','Your idea has been approved!','Your idea TEST-2026-0005 "Install shadow boards at all 8 workstations" has been fully approved and is ready for implementation.','idea','b1000000-0000-0000-0000-000000000006',FALSE,NULL,NOW()-INTERVAL '3 days'),
('a0000000-0000-0000-0000-000000000006','STEP_ASSIGNED','Safety review required for an idea','Idea TEST-2026-0004 "Replace open cable trays with enclosed conduit" requires your safety review. SLA: 48 hours.','idea','b1000000-0000-0000-0000-000000000005',FALSE,NULL,NOW()-INTERVAL '3 days'),
('a0000000-0000-0000-0000-000000000002','KAIZEN_APPROVED','Your Kaizen has been fully approved!','Your Kaizen KZ-NSK-26-0004 "Reduce changeover time on BM-03 using SMED" has been approved. Eligible for Rewards & Recognition.','kaizen','f1000000-0000-0000-0000-000000000010',FALSE,NULL,NOW()-INTERVAL '15 days'),
('a0000000-0000-0000-0000-000000000003','SLA_REMINDER','Reminder: Idea review SLA approaching','Idea TEST-2026-0001 "Leaking hydraulic hose" has been pending Zone Leader review for 36 hours. SLA deadline: 12 hours remaining.','idea','b1000000-0000-0000-0000-000000000002',TRUE,NOW()-INTERVAL '5 days',NOW()-INTERVAL '6 days'),
('a0000000-0000-0000-0000-000000000004','SLA_ESCALATED','Escalation: Overdue idea review','Idea TEST-2026-0011 "Slippery floor near coolant drain" pending Zone Leader review 60 hours (12 past SLA). Please take action.','idea','b1000000-0000-0000-0000-000000000012',FALSE,NULL,NOW()-INTERVAL '1 day'),
('a0000000-0000-0000-0000-000000000002','REWARD_ASSIGNED','Congratulations! Your Kaizen received a Regular Reward','KZ-NSK-26-0005 "Visual management board" awarded Regular Reward: ₹2,500 gift voucher + Certificate of Appreciation.','kaizen','f1000000-0000-0000-0000-000000000013',FALSE,NULL,NOW()-INTERVAL '22 days'),
('a0000000-0000-0000-0000-000000000008','REWARD_ASSIGNED','Special Award — High Impact Kaizen of the Year 2025!','KZ-NSK-26-0007 "Poka-Yoke on Capsule Fill Station" awarded Special High Impact Kaizen Award 2025: ₹25,000 + Trophy!','kaizen','f1000000-0000-0000-0000-000000000015',TRUE,NOW()-INTERVAL '55 days',NOW()-INTERVAL '60 days'),
('a0000000-0000-0000-0000-000000000003','STEP_ASSIGNED','One Pager submitted — your implementation review required','Kaizen KZ-NSK-26-0003 "Eliminate double-handling in packaging" One Pager submitted. Please review for Zone Leader approval.','kaizen','f1000000-0000-0000-0000-000000000009',FALSE,NULL,NOW()-INTERVAL '12 hours'),
('a0000000-0000-0000-0000-000000000003','STEP_APPROVED','Idea approved at your stage','Your Zone Leader approval on TEST-2026-0002 has been processed. The idea is now with HOD for review.','idea','b1000000-0000-0000-0000-000000000003',TRUE,NOW()-INTERVAL '4 days',NOW()-INTERVAL '5 days'),
('a0000000-0000-0000-0000-000000000008','IDEA_APPROVED','Your idea has been approved!','Your idea TEST-2026-0006 "SPC charts for CB-07" has been fully approved. Please begin implementation.','idea','b1000000-0000-0000-0000-000000000007',FALSE,NULL,NOW()-INTERVAL '2 days'),
('a0000000-0000-0000-0000-00000000000a','STEP_ASSIGNED','High Impact Kaizen assigned for your rating','Kaizen KZ-NSK-26-0006 "SMED CB Line 2" has been nominated for High Impact evaluation. Please provide your rating.','kaizen','f1000000-0000-0000-0000-000000000014',TRUE,NOW()-INTERVAL '14 days',NOW()-INTERVAL '18 days');

-- =============================================================================
-- SECTION 13: AUDIT LOGS — every action type
-- =============================================================================

INSERT INTO audit_logs (performed_by, action, entity_type, entity_id, payload, performed_at) VALUES
('a0000000-0000-0000-0000-000000000002','IDEA_SUBMITTED','idea','b1000000-0000-0000-0000-000000000002','{"registration_id":"TEST-2026-0001","title":"Leaking hydraulic hose near press machine"}',NOW()-INTERVAL '8 days'),
(NULL,'PUBLIC_IDEA_SUBMITTED','idea','b1000000-0000-0000-0000-000000000012','{"registration_id":"TEST-2026-0011","anon_name":"Anonymous","source":"qr_code"}',NOW()-INTERVAL '4 days'),
('a0000000-0000-0000-0000-000000000003','STEP_APPROVED','idea','b1000000-0000-0000-0000-000000000003','{"step":"ZONE_LEADER_REVIEW","comment":"Idea is feasible and well-described. Proceeding to HOD."}',NOW()-INTERVAL '5 days'),
('a0000000-0000-0000-0000-000000000003','STEP_RETURNED','idea','b1000000-0000-0000-0000-000000000004','{"step":"ZONE_LEADER_REVIEW","comment":"Please provide machine tag numbers for P-12, P-13, P-14 and attach wiring photo."}',NOW()-INTERVAL '6 days'),
('a0000000-0000-0000-0000-000000000004','STEP_REJECTED','idea','b1000000-0000-0000-0000-000000000011','{"step":"HOD_REVIEW","comment":"Scope too large. Must go through CAPEX. Resubmit as scoped pilot."}',NOW()-INTERVAL '15 days'),
('a0000000-0000-0000-0000-000000000003','MARKED_IMPLEMENTED','idea','b1000000-0000-0000-0000-000000000009','{"kaizen_id":"KZ-NSK-26-0003","implementation_owner":"a0000000-0000-0000-0000-000000000003"}',NOW()-INTERVAL '1 day'),
('a0000000-0000-0000-0000-000000000003','ONE_PAGER_DRAFT_SAVED','kaizen','f1000000-0000-0000-0000-000000000008','{"kaizen_id":"KZ-NSK-26-0002","fields_completed":["title","team","problem_statement","5why","before_description"]}',NOW()-INTERVAL '6 hours'),
('a0000000-0000-0000-0000-000000000002','ONE_PAGER_SUBMITTED','kaizen','f1000000-0000-0000-0000-000000000009','{"kaizen_id":"KZ-NSK-26-0003"}',NOW()-INTERVAL '12 hours'),
('a0000000-0000-0000-0000-000000000004','KAIZEN_APPROVED','kaizen','f1000000-0000-0000-0000-000000000010','{"kaizen_id":"KZ-NSK-26-0004","final_approver":"HOD","comment":"Excellent documentation. Results verified."}',NOW()-INTERVAL '15 days'),
('a0000000-0000-0000-0000-000000000005','REGULAR_REWARD_ASSIGNED','kaizen','f1000000-0000-0000-0000-000000000013','{"reward_type":"REGULAR","amount":2500,"details":"Certificate + gift voucher"}',NOW()-INTERVAL '22 days'),
('a0000000-0000-0000-0000-000000000005','HIGH_IMPACT_NOMINATED','kaizen','f1000000-0000-0000-0000-000000000014','{"nomination_id":"e1000000-0000-0000-0000-000000000014","sc_members":["sc@acg.com","sc2@acg.com"]}',NOW()-INTERVAL '18 days'),
('a0000000-0000-0000-0000-00000000000a','SC_RATING_SUBMITTED','kaizen','f1000000-0000-0000-0000-000000000014','{"nomination_id":"e1000000-0000-0000-0000-000000000014","sc_member":"sc@acg.com","score":8.5}',NOW()-INTERVAL '15 days'),
('a0000000-0000-0000-0000-000000000005','SPECIAL_REWARD_NOMINATED','kaizen','f1000000-0000-0000-0000-000000000015','{"reward_type":"SPECIAL","amount":25000}',NOW()-INTERVAL '60 days'),
('a0000000-0000-0000-0000-000000000005','INTER_PLANT_NOMINATED','kaizen','f1000000-0000-0000-0000-000000000015','{"competition_year":2025,"round":"NATIONAL","result":"WON"}',NOW()-INTERVAL '70 days'),
('a0000000-0000-0000-0000-000000000004','SLA_ESCALATED','idea','b1000000-0000-0000-0000-000000000012','{"stage":"ZONE_LEADER_REVIEW","overdue_hours":12,"escalated_to":"Plant OPEX"}',NOW()-INTERVAL '1 day'),
('a0000000-0000-0000-0000-000000000002','IDEA_SUBMITTED','idea','b1000000-0000-0000-0000-000000000008','{"registration_id":"TEST-2026-0007","title":"Fire extinguisher inspection register digitalisation"}',NOW()-INTERVAL '2 days'),
('a0000000-0000-0000-0000-000000000008','IDEA_SUBMITTED','idea','b1000000-0000-0000-0000-000000000014','{"registration_id":"TEST-2026-0013","title":"SMED CB Line 2 High Impact"}',NOW()-INTERVAL '32 days'),
('a0000000-0000-0000-0000-000000000005','REGULAR_REWARD_ASSIGNED','kaizen','f1000000-0000-0000-0000-000000000010','{"reward_type":"REGULAR","amount":2500}',NOW()-INTERVAL '12 days'),
('a0000000-0000-0000-0000-000000000003','STEP_APPROVED','kaizen','f1000000-0000-0000-0000-000000000010','{"step":"ZONE_LEADER_REVIEW","comment":"One pager complete and well documented."}',NOW()-INTERVAL '18 days'),
('a0000000-0000-0000-0000-000000000008','ONE_PAGER_SUBMITTED','kaizen','f1000000-0000-0000-0000-000000000015','{"kaizen_id":"KZ-NSK-26-0007"}',NOW()-INTERVAL '87 days');
