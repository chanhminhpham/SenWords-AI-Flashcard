-- Word family tables for Story 2.1
-- Groups vocabulary words that share the same root (e.g., environment -> environmental -> environmentally)

CREATE TABLE word_families (
  id SERIAL PRIMARY KEY,
  root_word TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE word_family_members (
  id SERIAL PRIMARY KEY,
  family_id INTEGER NOT NULL REFERENCES word_families(id),
  card_id INTEGER REFERENCES vocabulary_cards(id),
  word_text TEXT NOT NULL,
  part_of_speech TEXT NOT NULL,
  form_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wfm_family_id ON word_family_members(family_id);
CREATE INDEX idx_wfm_card_id ON word_family_members(card_id);

-- Enable RLS (read-only dictionary data)
ALTER TABLE word_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on word_families"
  ON word_families FOR SELECT
  USING (true);

CREATE POLICY "Allow public read on word_family_members"
  ON word_family_members FOR SELECT
  USING (true);
