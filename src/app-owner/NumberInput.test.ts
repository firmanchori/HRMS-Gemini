import { describe, it, expect } from "vitest";
import { maskLeadingZero } from "./NumberInput";

describe("maskLeadingZero", () => {
  it("strips a plain leading zero: 01 -> 1", () => {
    expect(maskLeadingZero("01")).toBe("1");
  });

  it("strips multiple leading zeros: 007 -> 7", () => {
    expect(maskLeadingZero("007")).toBe("7");
  });

  it("keeps a lone zero", () => {
    expect(maskLeadingZero("0")).toBe("0");
  });

  it("keeps a valid decimal starting with 0.", () => {
    expect(maskLeadingZero("0.1")).toBe("0.1");
    expect(maskLeadingZero("0.05")).toBe("0.05");
  });

  it("normalizes a double-zero decimal down to one leading zero: 00.1 -> 0.1", () => {
    expect(maskLeadingZero("00.1")).toBe("0.1");
  });

  it("leaves non-zero-leading numbers untouched", () => {
    expect(maskLeadingZero("10")).toBe("10");
    expect(maskLeadingZero("5")).toBe("5");
  });

  it("leaves an empty string untouched", () => {
    expect(maskLeadingZero("")).toBe("");
  });
});
