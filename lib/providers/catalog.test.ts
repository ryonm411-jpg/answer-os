import { describe, expect, it } from "vitest";
import { PROVIDER_CATALOG } from "./catalog";
import { ALL_PROVIDERS, FREE_PROVIDERS, PREMIUM_PROVIDERS } from "./tiers";

describe("lib/providers/catalog", () => {
  it("contains exactly one entry per registered provider name", () => {
    const names = PROVIDER_CATALOG.map((entry) => entry.name);
    expect(new Set(names).size).toBe(names.length); // no duplicates
    // Set equality — catalog display order may differ from tiers.ts list order
    expect([...names].sort()).toEqual([...ALL_PROVIDERS].sort());
  });

  it("has non-empty display metadata for every entry", () => {
    for (const entry of PROVIDER_CATALOG) {
      expect(entry.label.trim().length).toBeGreaterThan(0);
      expect(entry.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("classifies every catalog name consistently with the tier lists", () => {
    const catalogNames = PROVIDER_CATALOG.map((entry) => entry.name);
    const free = catalogNames.filter((name) => FREE_PROVIDERS.includes(name));
    const premium = catalogNames.filter((name) => PREMIUM_PROVIDERS.includes(name));

    expect([...free].sort()).toEqual([...FREE_PROVIDERS].sort());
    expect([...premium].sort()).toEqual([...PREMIUM_PROVIDERS].sort());
    expect([...free, ...premium].sort()).toEqual([...catalogNames].sort());
  });

  it("lists free providers before premium providers", () => {
    const firstPremiumIndex = PROVIDER_CATALOG.findIndex((entry) =>
      PREMIUM_PROVIDERS.includes(entry.name)
    );
    const lastFreeIndex = PROVIDER_CATALOG.map((entry) => entry.name)
      .map((name, index) => (FREE_PROVIDERS.includes(name) ? index : -1))
      .reduce((max, index) => Math.max(max, index), -1);
    expect(firstPremiumIndex).toBeGreaterThan(lastFreeIndex);
  });
});
