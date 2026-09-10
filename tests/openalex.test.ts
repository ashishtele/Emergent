import { describe, it, expect } from "vitest";
import { decodeAbstract } from "../lib/openalex";

describe("decodeAbstract", () => {
  it("rebuilds text from inverted index by position", () => {
    expect(decodeAbstract({ hello: [0], world: [1] })).toBe("hello world");
  });
  it("orders out-of-order positions", () => {
    expect(decodeAbstract({ b: [1], a: [0], c: [2] })).toBe("a b c");
  });
  it("returns empty string for missing index", () => {
    expect(decodeAbstract(null)).toBe("");
    expect(decodeAbstract(undefined)).toBe("");
  });
});
