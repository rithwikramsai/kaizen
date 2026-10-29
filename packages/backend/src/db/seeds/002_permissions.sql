-- 002_permissions.sql
-- Idempotent: ON CONFLICT DO NOTHING

INSERT INTO permissions (id, code, description) VALUES
  ('00000000-0000-0000-0001-000000000001', 'CAN_SUBMIT_IDEA',           'Submit an idea (anonymous or named)'),
  ('00000000-0000-0000-0001-000000000002', 'CAN_VIEW_OWN_IDEAS',        'View ideas submitted by self'),
  ('00000000-0000-0000-0001-000000000003', 'CAN_VIEW_ZONE_IDEAS',       'View all ideas in own zone'),
  ('00000000-0000-0000-0001-000000000004', 'CAN_VIEW_PLANT_IDEAS',      'View all ideas in own plant'),
  ('00000000-0000-0000-0001-000000000005', 'CAN_VIEW_ALL_IDEAS',        'View ideas across all plants'),
  ('00000000-0000-0000-0001-000000000006', 'CAN_APPROVE_IDEA',          'Approve/return/reject at idea review steps'),
  ('00000000-0000-0000-0001-000000000007', 'CAN_REVIEW_SAFETY',         'Approve/return/reject at safety review step'),
  ('00000000-0000-0000-0001-000000000008', 'CAN_REVIEW_QUALITY',        'Approve/return/reject at quality review step'),
  ('00000000-0000-0000-0001-000000000009', 'CAN_REVIEW_IMPLEMENTATION', 'Approve/return/reject at implementation review steps'),
  ('00000000-0000-0000-0001-000000000010', 'CAN_REVIEW_SME',            'Approve/return/reject at SME review step'),
  ('00000000-0000-0000-0001-000000000011', 'CAN_UPLOAD_SCI_TECH',       'Upload Sci-Tech documents at SCI_TECH_UPLOAD step'),
  ('00000000-0000-0000-0001-000000000012', 'CAN_MARK_IMPLEMENTED',      'Mark idea as implemented (triggers One Pager creation)'),
  ('00000000-0000-0000-0001-000000000013', 'CAN_SUBMIT_ONE_PAGER',      'Submit One Pager (initiates IMPLEMENTATION_APPROVAL workflow)'),
  ('00000000-0000-0000-0001-000000000014', 'CAN_ASSIGN_IMPL_OWNER',     'Assign implementation owner to an approved idea'),
  ('00000000-0000-0000-0001-000000000015', 'CAN_RATE_HIGH_IMPACT',      'Submit SC rating for a High Impact nomination'),
  ('00000000-0000-0000-0001-000000000016', 'CAN_ASSIGN_REWARD',         'Assign Regular R&R reward to an approved kaizen'),
  ('00000000-0000-0000-0001-000000000017', 'CAN_NOMINATE_HIGH_IMPACT',  'Nominate an approved kaizen as High Impact'),
  ('00000000-0000-0000-0001-000000000018', 'CAN_NOMINATE_SPECIAL_RR',   'Nominate a rated kaizen for Special R&R'),
  ('00000000-0000-0000-0001-000000000019', 'CAN_NOMINATE_INTER_PLANT',  'Nominate a kaizen for Inter-Plant competition'),
  ('00000000-0000-0000-0001-000000000020', 'CAN_MANAGE_USERS',          'Create, update, deactivate user accounts; assign roles'),
  ('00000000-0000-0000-0001-000000000021', 'CAN_MANAGE_MASTER_DATA',    'Create/update/deactivate categories, zones, departments, SLA configs'),
  ('00000000-0000-0000-0001-000000000022', 'CAN_VIEW_REPORTS',          'Access analytics and reports dashboards'),
  ('00000000-0000-0000-0001-000000000023', 'CAN_MANAGE_SYSTEM',         'Full system administration (includes all permissions above)')
ON CONFLICT (code) DO NOTHING;
