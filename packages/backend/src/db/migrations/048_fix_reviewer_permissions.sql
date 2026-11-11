-- 048_fix_reviewer_permissions.sql
-- Plant Safety, Plant Quality, and SME can see all ideas in their plant
-- (required so Review Queue and All Ideas work for these roles).

INSERT INTO role_permissions (role_id, permission_id) VALUES
  -- Plant Safety → CAN_VIEW_PLANT_IDEAS
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0001-000000000004'),
  -- Plant Quality → CAN_VIEW_PLANT_IDEAS
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0001-000000000004'),
  -- SME → CAN_VIEW_PLANT_IDEAS
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0001-000000000004')
ON CONFLICT DO NOTHING;
