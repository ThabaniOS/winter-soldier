CREATE TABLE writing_pieces (
  id                SERIAL PRIMARY KEY,
  title             TEXT NOT NULL,
  type              TEXT CHECK (type IN ('journal','linkedin_post','thabani_os_post','other')),
  finished_date     DATE NOT NULL,
  link_or_location  TEXT,
  notes             TEXT
);
