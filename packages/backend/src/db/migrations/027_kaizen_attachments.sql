-- 027_kaizen_attachments.sql

CREATE TABLE IF NOT EXISTS kaizen_attachments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id       UUID        NOT NULL REFERENCES kaizens(id)       ON DELETE CASCADE,
  file_id         UUID        NOT NULL REFERENCES file_metadata(id) ON DELETE RESTRICT,
  attachment_type VARCHAR(50) NOT NULL
    CHECK (attachment_type IN ('BEFORE_PHOTO', 'AFTER_PHOTO', 'SUPPORTING_DOC'))
);

CREATE INDEX IF NOT EXISTS kaizen_attachments_kaizen_id_idx ON kaizen_attachments(kaizen_id);
CREATE INDEX IF NOT EXISTS kaizen_attachments_file_id_idx   ON kaizen_attachments(file_id);
