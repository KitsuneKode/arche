-- CreateTable
CREATE TABLE "relay_run_score" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relay_run_score_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "relay_run_score_score_createdAt_idx" ON "relay_run_score"("score" DESC, "createdAt" DESC);

-- CreateIndex
CREATE INDEX "relay_run_score_userId_score_idx" ON "relay_run_score"("userId", "score" DESC);

-- AddForeignKey
ALTER TABLE "relay_run_score" ADD CONSTRAINT "relay_run_score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
