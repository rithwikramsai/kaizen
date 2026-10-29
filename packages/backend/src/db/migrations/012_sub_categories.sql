-- 012_sub_categories.sql

CREATE TABLE IF NOT EXISTS sub_categories (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID         NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(50)  NOT NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sub_categories_code_uidx    ON sub_categories(code);
CREATE INDEX        IF NOT EXISTS sub_categories_category_idx  ON sub_categories(category_id);
