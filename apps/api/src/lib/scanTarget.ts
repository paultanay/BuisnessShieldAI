import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type ScanTargetAddress = {
  address: string;
  family: number;
};

export type ScanTargetLookup = (hostname: string) => Promise<ScanTargetAddress[]>;

export type ScanTargetValidation =
  | {
      ok: true;
      url: string;
      hostname: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function validateScanTargetUrl(
  value: string | null | undefined,
  lookupAddress: ScanTargetLookup = lookupPublicAddresses,
): Promise<ScanTargetValidation> {
  const parsed = parseHttpUrl(value);
  if (!parsed) return invalidUrl();

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isBlockedHostname(hostname) || isPrivateIpAddress(hostname)) {
    return privateAddress();
  }

  try {
    const addresses = await lookupAddress(hostname);
    if (addresses.length === 0 || addresses.some((entry) => isPrivateIpAddress(entry.address))) {
      return privateAddress();
    }
  } catch {
    return { ok: false, error: "Scan target hostname could not be resolved." };
  }

  return {
    ok: true,
    url: parsed.toString(),
    hostname,
  };
}

export function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".lan")
  );
}

export function isPrivateIpAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  const version = isIP(normalized);

  if (version === 4) return isPrivateIpv4(normalized);
  if (version === 6) return isPrivateIpv6(normalized);
  return false;
}

function parseHttpUrl(value: string | null | undefined): URL | null {
  const rawValue = value?.trim();
  if (!rawValue) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function lookupPublicAddresses(hostname: string): Promise<ScanTargetAddress[]> {
  return lookup(hostname, { all: true });
}

function invalidUrl(): ScanTargetValidation {
  return { ok: false, error: "Scan target must be a public HTTP or HTTPS URL." };
}

function privateAddress(): ScanTargetValidation {
  return { ok: false, error: "Scan target must resolve to a public internet address." };
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true;

  const [first, second] = parts;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  return (
    address === "::" ||
    address === "::1" ||
    address.startsWith("fc") ||
    address.startsWith("fd") ||
    address.startsWith("fe8") ||
    address.startsWith("fe9") ||
    address.startsWith("fea") ||
    address.startsWith("feb") ||
    address.startsWith("::ffff:127.") ||
    address.startsWith("::ffff:10.") ||
    address.startsWith("::ffff:192.168.")
  );
}
