import { describe, it, expect } from "vitest";
import { calculatePPh21TER, calculateBPJS, getTERCategory } from "./taxCalculator";

// Every bracket boundary below is transcribed from the official Lampiran
// of PMK 168/2023 (pajak.go.id) — see taxCalculator.ts's TER_*_BRACKETS
// comment for provenance. These pin the table down so a future edit can't
// silently drift back to approximated numbers.

describe("getTERCategory", () => {
  it("maps PTKP to the correct TER category", () => {
    expect(getTERCategory("TK/0")).toBe("TER A");
    expect(getTERCategory("TK/1")).toBe("TER A");
    expect(getTERCategory("K/0")).toBe("TER A");
    expect(getTERCategory("TK/2")).toBe("TER B");
    expect(getTERCategory("TK/3")).toBe("TER B");
    expect(getTERCategory("K/1")).toBe("TER B");
    expect(getTERCategory("K/2")).toBe("TER B");
    expect(getTERCategory("K/3")).toBe("TER C");
  });
});

describe("calculatePPh21TER — TER A (PTKP TK/0)", () => {
  it("is 0% at and below the first bracket ceiling", () => {
    expect(calculatePPh21TER(5400000, "TK/0").ratePercent).toBe(0);
  });
  it("is 0.25% just above the first bracket", () => {
    expect(calculatePPh21TER(5400001, "TK/0").ratePercent).toBe(0.25);
    expect(calculatePPh21TER(5650000, "TK/0").ratePercent).toBe(0.25);
  });
  it("matches a known mid-table bracket (24% at the 103jt ceiling)", () => {
    expect(calculatePPh21TER(103000000, "TK/0").ratePercent).toBe(24.0);
  });
  it("continues past the old (buggy) flat-25% cap into the real upper brackets", () => {
    expect(calculatePPh21TER(103000001, "TK/0").ratePercent).toBe(25.0);
    expect(calculatePPh21TER(125000000, "TK/0").ratePercent).toBe(25.0);
    expect(calculatePPh21TER(125000001, "TK/0").ratePercent).toBe(26.0);
    expect(calculatePPh21TER(550000000, "TK/0").ratePercent).toBe(30.0);
  });
  it("reaches the true 34% ceiling above Rp1.4 miliar", () => {
    expect(calculatePPh21TER(1400000000, "TK/0").ratePercent).toBe(33.0);
    expect(calculatePPh21TER(1400000001, "TK/0").ratePercent).toBe(34.0);
    expect(calculatePPh21TER(5000000000, "TK/0").ratePercent).toBe(34.0);
  });
  it("computes taxAmount as gross * rate", () => {
    const { taxAmount } = calculatePPh21TER(10000000, "TK/0");
    expect(taxAmount).toBe(Math.round(10000000 * 0.02)); // 10.000.000 falls in the 2.00% bracket (9.650.001-10.050.000)
  });
});

describe("calculatePPh21TER — TER B (PTKP TK/2)", () => {
  it("matches the official table from the 7th bracket on, where the old code diverged", () => {
    // Old code: flat 2.0% from 10.750.001-12.550.000 — official splits this into 2.0/2.5/3.0.
    expect(calculatePPh21TER(11250000, "TK/2").ratePercent).toBe(2.0);
    expect(calculatePPh21TER(11250001, "TK/2").ratePercent).toBe(2.5);
    expect(calculatePPh21TER(11600001, "TK/2").ratePercent).toBe(3.0);
  });
  it("reaches the true 34% ceiling above Rp1.405 miliar", () => {
    expect(calculatePPh21TER(1405000000, "TK/2").ratePercent).toBe(33.0);
    expect(calculatePPh21TER(1405000001, "TK/2").ratePercent).toBe(34.0);
  });
});

describe("calculatePPh21TER — TER C (PTKP K/3)", () => {
  it("matches the official table from the 6th bracket on, where the old code diverged", () => {
    // Old code: flat 1.5% from 8.850.001-10.600.000 — official splits in 1.25/1.5/1.75/2.0.
    expect(calculatePPh21TER(9800000, "K/3").ratePercent).toBe(1.25);
    expect(calculatePPh21TER(9800001, "K/3").ratePercent).toBe(1.5);
    expect(calculatePPh21TER(10950001, "K/3").ratePercent).toBe(1.75);
    expect(calculatePPh21TER(11200001, "K/3").ratePercent).toBe(2.0);
  });
  it("reaches the true 34% ceiling above Rp1.419 miliar", () => {
    expect(calculatePPh21TER(1419000000, "K/3").ratePercent).toBe(33.0);
    expect(calculatePPh21TER(1419000001, "K/3").ratePercent).toBe(34.0);
  });
});

describe("calculateBPJS", () => {
  it("caps BPJS Kesehatan contribution base at Rp12.000.000", () => {
    const result = calculateBPJS(20000000);
    expect(result.bpjsKesCompany).toBe(Math.round(12000000 * 0.04));
    expect(result.bpjsKesEmployee).toBe(Math.round(12000000 * 0.01));
  });
  it("caps Jaminan Pensiun contribution base at Rp10.547.400 (2025 figure)", () => {
    const result = calculateBPJS(20000000);
    expect(result.breakdown.jpCompany).toBe(Math.round(10547400 * 0.02));
    expect(result.breakdown.jpEmployee).toBe(Math.round(10547400 * 0.01));
  });
  it("does not cap JHT/JKK/JKM — they apply to full wage", () => {
    const wage = 20000000;
    const result = calculateBPJS(wage);
    expect(result.breakdown.jhtCompany).toBe(Math.round(wage * 0.037));
    expect(result.breakdown.jkkCompany).toBe(Math.round(wage * 0.0024));
    expect(result.breakdown.jkmCompany).toBe(Math.round(wage * 0.003));
  });
});
