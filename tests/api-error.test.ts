import { describe, it, expect } from "vitest";
import { apiError, badRequest } from "../lib/api-error";

describe("api errors", () => {
  it("returns 503 with a safe message by default", async () => {
    const res = apiError();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: "Research data is temporarily unavailable. Please try again in a moment.",
    });
  });
  it("badRequest returns 400 without internals", async () => {
    const res = badRequest("Invalid ?q=");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid ?q=" });
  });
});
