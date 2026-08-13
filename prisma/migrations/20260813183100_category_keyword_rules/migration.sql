-- CreateTable
CREATE TABLE "CategoryKeywordRule" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryKeywordRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryKeywordRule_keyword_key" ON "CategoryKeywordRule"("keyword");

-- CreateIndex
CREATE INDEX "CategoryKeywordRule_categoryId_idx" ON "CategoryKeywordRule"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryKeywordRule_priority_idx" ON "CategoryKeywordRule"("priority");

-- AddForeignKey
ALTER TABLE "CategoryKeywordRule" ADD CONSTRAINT "CategoryKeywordRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
