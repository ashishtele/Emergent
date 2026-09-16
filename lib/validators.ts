import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["works", "authors", "institutions", "topics"]).default("works"),
  page: z.coerce.number().int().min(1).default(1),
  oa: z.coerce.boolean().optional(),
  rerank: z.coerce.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1).max(100),
});

export const readingPathSchema = z.object({
  topic: z.string().min(1).max(120),
  topicId: z.string().min(1).max(20).optional(),
});

export const briefSchema = z.union([
  z.object({
    openalexId: z.string().min(1).max(20),
  }),
  z.object({
    pdfUrl: z.string().url().max(500),
    title: z.string().min(1).max(300),
  }),
]);

export const rankSchema = z.object({
  query: z.string().min(1).max(200),
  papers: z
    .array(
      z.object({
        openalexId: z.string().min(1).max(40),
        title: z.string().min(1).max(500),
        abstract: z.string().max(8000).optional(),
        year: z.string().max(10).optional(),
        cited_by_count: z.number().int().min(0).max(10000000).optional(),
      }),
    )
    .min(1)
    .max(20),
});
