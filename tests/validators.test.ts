import { describe, it, expect } from "vitest";
import { searchQuerySchema, idParamSchema } from "../lib/validators";

describe("searchQuerySchema", () => {
  it("accepts a minimal query with defaults", () => {
    expect(searchQuerySchema.parse({ q: "AI agents" })).toMatchObject({
      q: "AI agents",
      type: "works",
      page: 1,
    });
  });
  it("rejects empty or oversized queries", () => {
    expect(searchQuerySchema.safeParse({ q: "" }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: "x".repeat(201) }).success).toBe(false);
  });
  it("rejects unknown types and bad pages", () => {
    expect(searchQuerySchema.safeParse({ q: "a", type: "nope" }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: "a", page: "0" }).success).toBe(false);
  });
});

describe("idParamSchema", () => {
  it("accepts OpenAlex-style ids and rejects empty", () => {
    expect(idParamSchema.safeParse({ id: "W2741809807" }).success).toBe(true);
    expect(idParamSchema.safeParse({ id: "" }).success).toBe(false);
  });
});
