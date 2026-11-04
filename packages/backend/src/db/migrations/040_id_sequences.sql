-- 040_id_sequences.sql
-- Replace COUNT(*)+1 ID generation with dedicated sequences to eliminate the race
-- condition where two concurrent submissions read the same count and collide.
--
-- idea_registration_seq  → powers IDEA-{plant}-{YY}-{seq}
-- kaizen_id_seq          → powers KIET-K-{YY}-{seq}
--
-- Initialized past current row counts so existing records are never re-used.

CREATE SEQUENCE IF NOT EXISTS idea_registration_seq;
CREATE SEQUENCE IF NOT EXISTS kaizen_id_seq;

SELECT setval(
  'idea_registration_seq',
  GREATEST(1, (SELECT COUNT(*) FROM ideas) + 1),
  false
);

SELECT setval(
  'kaizen_id_seq',
  GREATEST(1, (SELECT COUNT(*) FROM kaizens) + 1),
  false
);
