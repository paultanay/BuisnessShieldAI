import { describe, expect, it } from "vitest";
import { resolveCoverageProfile } from "./complianceCoverage";

describe("resolveCoverageProfile", () => {
  it("does not treat non-US countries as CCPA by default", () => {
    for (const country of ["IN", "BR", "SG"]) {
      const profile = resolveCoverageProfile({ country });

      expect(profile.isUnitedStates).toBe(false);
      expect(profile.appliesCcpa).toBe(false);
    }
  });

  it("applies CCPA only for US, California, or explicit CCPA concern", () => {
    expect(resolveCoverageProfile({ country: "US" }).appliesCcpa).toBe(true);
    expect(resolveCoverageProfile({ country: "CA-US" }).appliesCcpa).toBe(true);
    expect(resolveCoverageProfile({ country: "IN", primaryConcerns: ["ccpa"] }).appliesCcpa).toBe(true);
  });

  it("applies GDPR and ePrivacy for Europe and explicit GDPR concern", () => {
    for (const country of ["DE", "FR", "NL", "GB", "EU"]) {
      const profile = resolveCoverageProfile({ country });

      expect(profile.isEurope).toBe(true);
      expect(profile.appliesGdpr).toBe(true);
      expect(profile.appliesEprivacy).toBe(true);
    }

    const explicit = resolveCoverageProfile({ country: "IN", primaryConcerns: ["gdpr"] });

    expect(explicit.isEurope).toBe(false);
    expect(explicit.appliesGdpr).toBe(true);
    expect(explicit.appliesEprivacy).toBe(true);
  });
});
