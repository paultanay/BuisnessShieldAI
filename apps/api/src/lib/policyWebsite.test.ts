import { describe, expect, it } from "vitest";
import { normalizePolicyWebsiteUrl } from "./policyWebsite";

describe("normalizePolicyWebsiteUrl", () => {
  it("rejects empty and malformed URLs without throwing", () => {
    expect(normalizePolicyWebsiteUrl("")).toEqual({ ok: false, error: "A valid website URL is required." });
    expect(normalizePolicyWebsiteUrl("not a url")).toEqual({ ok: false, error: "A valid website URL is required." });
  });

  it("accepts HTTP and HTTPS URLs and returns normalized host context", () => {
    expect(normalizePolicyWebsiteUrl("example.com")).toEqual({
      ok: true,
      url: "https://example.com/",
      hostname: "example.com",
    });
    expect(normalizePolicyWebsiteUrl("http://example.com/path")).toEqual({
      ok: true,
      url: "http://example.com/path",
      hostname: "example.com",
    });
  });
});
