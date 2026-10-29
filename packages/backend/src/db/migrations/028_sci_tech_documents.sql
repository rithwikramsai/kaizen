-- 028_sci_tech_documents.sql

CREATE TABLE IF NOT EXISTS sci_tech_documents (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  kaizen_id     UUID         NOT NULL REFERENCES kaizens(id)       ON DELETE CASCADE,
  file_id       UUID         NOT NULL REFERENCES file_metadata(id) ON DELETE RESTRICT,
  uploaded_by   UUID         REFERENCES users(id) ON DELETE SET NULL,
  document_type VARCHAR(100),
  uploaded_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sci_tech_docs_kaizen_id_idx ON sci_tech_documents(kaizen_id);
CREATE INDEX IF NOT EXISTS sci_tech_docs_file_id_idx   ON sci_tech_documents(file_id);
