import { describe, it, expect } from "vitest";
import { getStatusMeta } from "./statusMeta";

describe("getStatusMeta", () => {
  it("returns correct label for each known machine condition", () => {
    expect(getStatusMeta("normal").label).toBe("NORMAL");
    expect(getStatusMeta("low").label).toBe("LOW");
    expect(getStatusMeta("moderate").label).toBe("MODERATE");
    expect(getStatusMeta("high").label).toBe("HIGH");
  });

  it("falls back to an UNKNOWN status for unrecognized input", () => {
    const meta = getStatusMeta("bogus");
    expect(meta.label).toBe("UNKNOWN");
  });

  it("orders severities from normal (lowest) to high (highest)", () => {
    expect(getStatusMeta("normal").severity).toBeLessThan(getStatusMeta("low").severity);
    expect(getStatusMeta("low").severity).toBeLessThan(getStatusMeta("moderate").severity);
    expect(getStatusMeta("moderate").severity).toBeLessThan(getStatusMeta("high").severity);
  });
});
