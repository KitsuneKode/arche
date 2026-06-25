-- AlterTable
ALTER TABLE "message" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "lattice_cell" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3),

    CONSTRAINT "lattice_cell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lattice_round" (
    "id" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "cellAId" TEXT NOT NULL,
    "cellBId" TEXT NOT NULL,
    "winnerId" TEXT,
    "status" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lattice_round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lattice_vote" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choice" TEXT NOT NULL,

    CONSTRAINT "lattice_vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lattice_vote_roundId_userId_key" ON "lattice_vote"("roundId", "userId");

-- AddForeignKey
ALTER TABLE "lattice_vote" ADD CONSTRAINT "lattice_vote_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "lattice_round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
