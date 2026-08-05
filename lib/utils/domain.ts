/**
 * Normalizes a user-inputted domain string by:
 * - Trimming whitespace
 * - Converting to lowercase
 * - Stripping protocols (http://, https://, etc.)
 * - Stripping leading "www."
 * - Removing trailing slashes, paths, ports, query strings, and hash fragments
 */
export function normalizeDomain(input: string): string {
  if (!input) return "";

  let domain = input.trim().toLowerCase();

  // Strip protocol if present
  domain = domain.replace(/^[a-zA-Z]+:\/\//, "");

  // Strip leading www.
  if (domain.startsWith("www.")) {
    domain = domain.slice(4);
  }

  // Strip port, path, query params, and hash fragments
  domain = domain.split("/")[0].split("?")[0].split("#")[0].split(":")[0];

  return domain;
}

/**
 * Validates a domain name format against standard domain rules:
 * - Must not be empty or exceed 253 characters
 * - Must consist of valid domain labels separated by dots
 * - TLD must be at least 2 characters long
 */
export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;

  const domainRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

  return domainRegex.test(domain);
}
