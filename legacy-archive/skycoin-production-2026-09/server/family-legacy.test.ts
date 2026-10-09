import { describe, expect, it } from "vitest";
import { FAMILY_LEGACY, getFamilyLegacyText } from "../client/src/data/familyLegacy";

describe("family legacy message", () => {
  it("preserves every daughter's name", () => {
    expect(FAMILY_LEGACY.children).toEqual([
      "Luna Avigail",
      "Summer Skye",
      "Alexis Isabella-Jane",
    ]);
  });

  it("preserves the shared first-word memory and signoff", () => {
    const message = getFamilyLegacyText();

    expect(FAMILY_LEGACY.firstWord).toBe("Dad");
    expect(message).toContain('first words was "Dad."');
    expect(message).toContain("please do not forget about me");
    expect(message).toContain("I love you—always. Dad");
  });
});
