import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(["works", "authors", "institutions", "topics"]).default("works"),
  page: z.coerce.number().int().min(1).default(1),
  oa: z.coerce.boolean().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1).max(100),
});
