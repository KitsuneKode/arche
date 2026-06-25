-- Keep one open clash at a time; close duplicates created by multi-instance race.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "roundNumber" DESC) AS rn
  FROM "lattice_round"
  WHERE status = 'open'
)
UPDATE "lattice_round" AS r
SET status = 'resolved',
    "winnerId" = r."cellAId"
FROM ranked
WHERE r.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX "lattice_round_one_open_idx" ON "lattice_round" ("status")
WHERE status = 'open';
