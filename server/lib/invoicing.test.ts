import { describe, it, expect } from "vitest";
import { buildInvoice } from "./invoicing.ts";

describe("buildInvoice", () => {
  it("charges the full base amount when there are no pending credits", () => {
    const result = buildInvoice("Professional", 2_000_000, []);
    expect(result.lineItems).toEqual([{ description: "Biaya langganan paket Professional", amountIdr: 2_000_000 }]);
    expect(result.totalAmountIdr).toBe(2_000_000);
    expect(result.consumedCreditIds).toEqual([]);
  });

  it("nets a single credit off the base amount (downgrade case study: Rp25.000 credit)", () => {
    const result = buildInvoice("Professional", 2_000_000, [{ id: "c1", amountIdr: 25_000, reason: "Downgrade 1 user" }]);
    expect(result.totalAmountIdr).toBe(1_975_000);
    expect(result.consumedCreditIds).toEqual(["c1"]);
    expect(result.lineItems).toEqual([
      { description: "Biaya langganan paket Professional", amountIdr: 2_000_000 },
      { description: "Kredit — Downgrade 1 user", amountIdr: -25_000 },
    ]);
  });

  it("applies multiple credits in order until the invoice is covered", () => {
    const result = buildInvoice("Starter", 100_000, [
      { id: "c1", amountIdr: 60_000, reason: "Downgrade A" },
      { id: "c2", amountIdr: 60_000, reason: "Downgrade B" },
    ]);
    // c1 fully applied (60.000), c2 only needs 40.000 of its 60.000 to zero out — still consumed in full per this model
    expect(result.totalAmountIdr).toBe(0);
    expect(result.consumedCreditIds).toEqual(["c1", "c2"]);
  });

  it("never goes below Rp0 even if credits exceed the base amount", () => {
    const result = buildInvoice("Starter", 50_000, [{ id: "c1", amountIdr: 200_000, reason: "Big downgrade" }]);
    expect(result.totalAmountIdr).toBe(0);
  });
});
