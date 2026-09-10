/*
  Warnings:

  - The primary key for the `saved_papers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `user_id` on the `saved_papers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "saved_papers" DROP CONSTRAINT "saved_papers_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "saved_papers_pkey" PRIMARY KEY ("user_id", "paper_id");
