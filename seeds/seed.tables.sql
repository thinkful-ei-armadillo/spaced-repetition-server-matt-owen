--  psql -U spacerep -d spacerep -f seeds/seed.tables.sql
--  psql -U spacerep -d spacerep_test -f seeds/seed.tables.sql

BEGIN;

TRUNCATE
  "word",
  "language",
  "user";

INSERT INTO "user" ("id", "username", "name", "password")
VALUES
  (
    1,
    'admin',
    'Dunder Mifflin Admin',
    -- password = "pass"
    '$2a$10$fCWkaGbt7ZErxaxclioLteLUgg4Q3Rp09WW0s/wSLxDKYsaGYUpjG'
  );

INSERT INTO "language" ("id", "name", "user_id")
VALUES
  (1, 'Spanish', 1);

INSERT INTO "word" ("id", "language_id", "original", "translation", "next")
VALUES
  (1, 1, 'palabra', 'word', 2),
  (2, 1, 'semana', 'week', 3),
  (3, 1, 'desafortunadamente', 'unfortunately', 4),
  (4, 1, 'anaranjado', 'orange', 5),
  (5, 1, 'quizá', 'maybe', 6),
  (6, 1, 'no me digas', 'shut up', 7),
  (7, 1, 'ayudame', 'help me', 8),
  (8, 1, 'dónde está el baño', 'where is the bathroom', null);

--   INSERT INTO "word" ("id", "language_id", "original", "translation", "next")
-- VALUES
--   (1, 1, 'palabra', 'word', 2),
--   (2, 1, 'semana', 'week', 3),
--   (3, 1, 'desafortunadamente', 'unfortunately', 4),
--   (4, 1, 'anaranjado', 'orange', 5),
--   (5, 1, 'quizás', 'maybe', 6),
--   (6, 1, 'poco', 'small', 7),
--   (7, 1, 'perro', 'dog', 8),
--   (8, 1, 'gato', 'cat', 9),
--   (9, 1, 'segundo', 'second', 10),
--   (10, 1, 'reloj', 'clock', 11),
--   (11, 1, 'ayer', 'yesterday', null);

UPDATE "language" SET head = 1 WHERE id = 1;

-- because we explicitly set the id fields
-- update the sequencer for future automatic id setting
SELECT setval('word_id_seq', (SELECT MAX(id) from "word"));
SELECT setval('language_id_seq', (SELECT MAX(id) from "language"));
SELECT setval('user_id_seq', (SELECT MAX(id) from "user"));

COMMIT;
