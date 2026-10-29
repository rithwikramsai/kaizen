-- 020_idea_attachments.sql

CREATE TABLE IF NOT EXISTS idea_attachments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id         UUID        NOT NULL REFERENCES ideas(id)          ON DELETE CASCADE,
  file_id         UUID        NOT NULL REFERENCES file_metadata(id)  ON DELETE RESTRICT,
  attachment_type VARCHAR(50) NOT NULL DEFAULT 'SUPPORTING_DOC'
    CHECK (attachment_type IN ('SUPPORTING_DOC'))
);

CREATE INDEX IF NOT EXISTS idea_attachments_idea_id_idx ON idea_attachments(idea_id);
CREATE INDEX IF NOT EXISTS idea_attachments_file_id_idx ON idea_attachments(file_id);
