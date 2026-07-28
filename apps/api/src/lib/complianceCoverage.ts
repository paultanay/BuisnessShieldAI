const EUROPEAN_PRIVACY_CODES = new Set([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  "EU",
  "EEA",
  "GB",
  "UK",
]);

const UNITED_STATES_CODES = new Set(["US", "USA", "CA-US"]);

export type CoverageProfile = {
  country: string;
  concerns: string[];
  isEurope: boolean;
  isUnitedStates: boolean;
  appliesGdpr: boolean;
  appliesEprivacy: boolean;
  appliesCcpa: boolean;
};

export function normalizeCountryCode(country: string | null | undefined): string {
  return (country ?? "OTHER").trim().toUpperCase() || "OTHER";
}

export function normalizeConcerns(primaryConcerns: string[] = []): string[] {
  return primaryConcerns.map((concern) => concern.trim().toLowerCase()).filter(Boolean);
}

export function resolveCoverageProfile(input: {
  country?: string | null;
  primaryConcerns?: string[];
}): CoverageProfile {
  const country = normalizeCountryCode(input.country);
  const concerns = normalizeConcerns(input.primaryConcerns);
  const isEurope = EUROPEAN_PRIVACY_CODES.has(country);
  const isUnitedStates = UNITED_STATES_CODES.has(country);
  const hasGdprConcern = concerns.includes("gdpr");
  const hasCcpaConcern = concerns.includes("ccpa");

  return {
    country,
    concerns,
    isEurope,
    isUnitedStates,
    appliesGdpr: isEurope || hasGdprConcern,
    appliesEprivacy: isEurope || hasGdprConcern,
    appliesCcpa: isUnitedStates || hasCcpaConcern,
  };
}
