import { describe, expect, it } from "vitest";
import { validateScanTargetUrl, type ScanTargetLookup } from "./scanTarget";

const publicLookup: ScanTargetLookup = async () => [{ address: "93.184.216.34", family: 4 }];
const privateLookup: ScanTargetLookup = async () => [{ address: "10.0.0.5", family: 4 }];

describe("validateScanTargetUrl", () => {
  it("accepts public HTTP and HTTPS targets", async () => {
    await expect(validateScanTargetUrl("example.com", publicLookup)).resolves.toEqual({
      ok: true,
      url: "https://example.com/",
      hostname: "example.com",
    });
    await expect(validateScanTargetUrl("http://example.com/path", publicLookup)).resolves.toEqual({
      ok: true,
      url: "http://example.com/path",
      hostname: "example.com",
    });
  });

  it("rejects non-HTTP protocols", async () => {
    await expect(validateScanTargetUrl("file:///etc/passwd", publicLookup)).resolves.toEqual({
      ok: false,
      error: "Scan target must be a public HTTP or HTTPS URL.",
    });
  });

  it("rejects localhost and private literal IP targets", async () => {
    for (const url of ["http://localhost", "http://127.0.0.1", "http://10.0.0.1", "http://192.168.1.10"]) {
      const result = await validateScanTargetUrl(url, publicLookup);

      expect(result).toEqual({
        ok: false,
        error: "Scan target must resolve to a public internet address.",
      });
    }
  });

  it("rejects hostnames that resolve to private IP addresses", async () => {
    await expect(validateScanTargetUrl("https://internal.example.com", privateLookup)).resolves.toEqual({
      ok: false,
      error: "Scan target must resolve to a public internet address.",
    });
  });
});
