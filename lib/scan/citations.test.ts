import { describe, it, expect } from "vitest";
import { normalizeDomain, classifyDomain, extractCitations } from "./citations";

describe("lib/scan/citations", () => {
  describe("normalizeDomain", () => {
    it("strips protocols, paths, ports, and www prefixes", () => {
      expect(normalizeDomain("https://www.reddit.com/r/laptops")).toBe("reddit.com");
      expect(normalizeDomain("HTTP://WWW.SKINIT.COM:8080/shop")).toBe("skinit.com");
      expect(normalizeDomain("mightyskins.com")).toBe("mightyskins.com");
    });
  });

  describe("classifyDomain", () => {
    it("classifies primary company domain as YOU", () => {
      expect(classifyDomain("skinit.com", "skinit.com", ["mightyskins.com"])).toBe("YOU");
      expect(classifyDomain("shop.skinit.com", "skinit.com", [])).toBe("YOU");
    });

    it("classifies competitor domains as COMPETITOR", () => {
      expect(classifyDomain("mightyskins.com", "skinit.com", ["mightyskins.com", "dbrand.com"])).toBe("COMPETITOR");
    });

    it("classifies social/forum domains as UGC", () => {
      expect(classifyDomain("reddit.com")).toBe("UGC");
      expect(classifyDomain("youtube.com")).toBe("UGC");
      expect(classifyDomain("forum.xda-developers.com")).toBe("UGC");
    });

    it("classifies media/tech review sites as EDITORIAL", () => {
      expect(classifyDomain("wirecutter.com")).toBe("EDITORIAL");
      expect(classifyDomain("theverge.com")).toBe("EDITORIAL");
      expect(classifyDomain("techcrunch.com")).toBe("EDITORIAL");
    });

    it("classifies marketplaces and search hubs as OTHER", () => {
      expect(classifyDomain("amazon.com")).toBe("OTHER");
      expect(classifyDomain("wikipedia.org")).toBe("OTHER");
    });

    it("classifies brand/merchant store domains as CORPORATE", () => {
      expect(classifyDomain("wrappz.com")).toBe("CORPORATE");
      expect(classifyDomain("toastmade.com")).toBe("CORPORATE");
    });
  });

  describe("extractCitations", () => {
    it("extracts markdown links, plain URLs, and domain mentions from text", () => {
      const text = `
      Check out [Skinit Custom Skins](https://www.skinit.com/custom-skins) for laptop protection.
      You can also see discussions on https://reddit.com/r/laptops and order from mightyskins.com or amazon.com.
      `;

      const citations = extractCitations(text, "skinit.com", ["mightyskins.com"]);

      expect(citations.length).toBe(4);
      const domains = citations.map((c) => c.domain);
      expect(domains).toContain("skinit.com");
      expect(domains).toContain("reddit.com");
      expect(domains).toContain("mightyskins.com");
      expect(domains).toContain("amazon.com");

      const skinit = citations.find((c) => c.domain === "skinit.com");
      expect(skinit?.citationType).toBe("YOU");

      const competitor = citations.find((c) => c.domain === "mightyskins.com");
      expect(competitor?.citationType).toBe("COMPETITOR");

      const ugc = citations.find((c) => c.domain === "reddit.com");
      expect(ugc?.citationType).toBe("UGC");

      const other = citations.find((c) => c.domain === "amazon.com");
      expect(other?.citationType).toBe("OTHER");
    });
  });
});
