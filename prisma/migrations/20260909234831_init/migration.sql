-- CreateTable
CREATE TABLE "papers" (
    "id" TEXT NOT NULL,
    "openalex_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "publication_date" TIMESTAMP(3),
    "doi" TEXT,
    "citation_count" INTEGER NOT NULL DEFAULT 0,
    "is_open_access" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authors" (
    "id" TEXT NOT NULL,
    "openalex_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orcid" TEXT,
    "institution_id" TEXT,

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "openalex_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "type" TEXT,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "openalex_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field" TEXT,
    "domain" TEXT,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_authors" (
    "paper_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,

    CONSTRAINT "paper_authors_pkey" PRIMARY KEY ("paper_id","author_id")
);

-- CreateTable
CREATE TABLE "paper_topics" (
    "paper_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,

    CONSTRAINT "paper_topics_pkey" PRIMARY KEY ("paper_id","topic_id")
);

-- CreateTable
CREATE TABLE "saved_papers" (
    "user_id" TEXT NOT NULL,
    "paper_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_papers_pkey" PRIMARY KEY ("user_id","paper_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "papers_openalex_id_key" ON "papers"("openalex_id");

-- CreateIndex
CREATE UNIQUE INDEX "authors_openalex_id_key" ON "authors"("openalex_id");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_openalex_id_key" ON "institutions"("openalex_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_openalex_id_key" ON "topics"("openalex_id");

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_authors" ADD CONSTRAINT "paper_authors_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_authors" ADD CONSTRAINT "paper_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_topics" ADD CONSTRAINT "paper_topics_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paper_topics" ADD CONSTRAINT "paper_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_papers" ADD CONSTRAINT "saved_papers_paper_id_fkey" FOREIGN KEY ("paper_id") REFERENCES "papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
