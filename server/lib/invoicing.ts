export interface InvoiceCredit {
  id: string;
  amountIdr: number;
  reason: string;
}

export interface InvoiceLineItem {
  description: string;
  amountIdr: number;
}

export interface InvoiceBuildResult {
  lineItems: InvoiceLineItem[];
  totalAmountIdr: number;
  /** Credit ids fully consumed by this invoice — caller marks them consumedAt. */
  consumedCreditIds: string[];
}

/**
 * Builds one billing-period invoice: base subscription charge for the
 * period, minus unconsumed account_credits (oldest first), never going
 * below Rp0. Credits are consumed in full up to what the invoice still
 * owes — a credit larger than the remaining balance is consumed in full
 * anyway (simplification: this billing model doesn't carry a credit
 * forward across invoices yet, since real per-tenant credit amounts are
 * always small prorated remainders, not whole-month values).
 */
export function buildInvoice(planName: string, baseAmountIdr: number, pendingCredits: InvoiceCredit[]): InvoiceBuildResult {
  const lineItems: InvoiceLineItem[] = [{ description: `Biaya langganan paket ${planName}`, amountIdr: baseAmountIdr }];
  let remaining = baseAmountIdr;
  const consumedCreditIds: string[] = [];

  for (const credit of pendingCredits) {
    if (remaining <= 0) break;
    const applied = Math.min(credit.amountIdr, remaining);
    lineItems.push({ description: `Kredit — ${credit.reason}`, amountIdr: -applied });
    remaining -= applied;
    consumedCreditIds.push(credit.id);
  }

  return { lineItems, totalAmountIdr: remaining, consumedCreditIds };
}
