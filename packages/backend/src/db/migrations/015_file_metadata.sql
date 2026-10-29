-- 015_file_metadata.sql

CREATE TABLE IF NOT EXISTS file_metadata (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name       VARCHAR(500) NOT NULL,
  file_path       TEXT         NOT NULL,
  file_size       BIGINT       NOT NULL,
  content_type    VARCHAR(200),
  uploaded_by     UUID         REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  storage_backend VARCHAR(50)  NOT NULL DEFAULT 'local'
    CHECK (storage_backend IN ('local', 's3', 'azure_blob', 'minio')),
  checksum        VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS file_metadata_uploaded_by_idx ON file_metadata(uploaded_by);
