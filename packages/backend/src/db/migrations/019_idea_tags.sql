-- 019_idea_tags.sql

CREATE TABLE IF NOT EXISTS idea_tags (
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (idea_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idea_tags_tag_id_idx ON idea_tags(tag_id);
