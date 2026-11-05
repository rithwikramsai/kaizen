-- HOD kaizen approval ratings (Business Impact, Sustenance, Innovation, BPR)
ALTER TABLE kaizens
  ADD COLUMN IF NOT EXISTS hod_business_impact  SMALLINT CHECK (hod_business_impact  IN (1, 3, 5)),
  ADD COLUMN IF NOT EXISTS hod_sustenance        SMALLINT CHECK (hod_sustenance        IN (1, 3, 5)),
  ADD COLUMN IF NOT EXISTS hod_innovation        SMALLINT CHECK (hod_innovation        IN (1, 3, 5)),
  ADD COLUMN IF NOT EXISTS hod_bpr_recommendation BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sme_bpr_recommendation BOOLEAN NOT NULL DEFAULT FALSE;

-- SC member 3-category ratings (Business Impact, Sustenance, Innovation — each 1/3/5)
ALTER TABLE sc_ratings
  ADD COLUMN IF NOT EXISTS business_impact_score SMALLINT CHECK (business_impact_score IN (1, 3, 5)),
  ADD COLUMN IF NOT EXISTS sustenance_score       SMALLINT CHECK (sustenance_score       IN (1, 3, 5)),
  ADD COLUMN IF NOT EXISTS innovation_score       SMALLINT CHECK (innovation_score       IN (1, 3, 5)),
  ADD COLUMN IF NOT EXISTS bpr_recommendation     BOOLEAN NOT NULL DEFAULT FALSE;
