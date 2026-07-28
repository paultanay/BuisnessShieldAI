export type NormalizedPolicyWebsite =
  | {
      ok: true;
      url: string;
      hostname: string;
    }
  | {
      ok: false;
      error: string;
    };

export function normalizePolicyWebsiteUrl(value: string | null | undefined): NormalizedPolicyWebsite {
  const rawValue = value?.trim();
  if (!rawValue) return invalidWebsiteUrl();

  const candidate = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) {
      return invalidWebsiteUrl();
    }

    return {
      ok: true,
      url: parsed.toString(),
      hostname: parsed.hostname,
    };
  } catch {
    return invalidWebsiteUrl();
  }
}

function invalidWebsiteUrl(): NormalizedPolicyWebsite {
  return { ok: false, error: "A valid website URL is required." };
}
