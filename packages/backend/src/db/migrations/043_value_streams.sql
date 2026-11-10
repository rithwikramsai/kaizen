-- 043_value_streams.sql
-- Master table for value streams (used as a dropdown in idea submission)

CREATE TABLE IF NOT EXISTS value_streams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL UNIQUE,
  code       VARCHAR(50),
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Seed common manufacturing value streams
INSERT INTO value_streams (name, code, sort_order) VALUES
  ('Safety',                   'SAF', 10),
  ('Quality',                  'QUA', 20),
  ('Delivery',                 'DEL', 30),
  ('Cost',                     'CST', 40),
  ('Morale / People',          'MOR', 50),
  ('Environment',              'ENV', 60),
  ('Productivity',             'PRD', 70),
  ('Maintenance',              'MNT', 80),
  ('5S / Workplace Organisation', '5S', 90),
  ('Energy Conservation',      'ENG', 100),
  ('Customer Satisfaction',    'CUS', 110),
  ('Innovation',               'INN', 120)
ON CONFLICT (name) DO NOTHING;
