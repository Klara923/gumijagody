-- DropIndex
DROP INDEX IF EXISTS "Attachment_checksum_idx";

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Attachment_checksum_key" ON "Attachment"("checksum");
