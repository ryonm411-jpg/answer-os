import { describe, it, expect } from "vitest";
import { calculatePromptCompetitiveGapFromRows } from "../scoring/competitive-gap-calc";

describe("getPromptCompetitiveGap wrapper re-export", () => {
  it("imports calculation function cleanly", () => {
    expect(typeof calculatePromptCompetitiveGapFromRows).toBe("function");
  });
});
