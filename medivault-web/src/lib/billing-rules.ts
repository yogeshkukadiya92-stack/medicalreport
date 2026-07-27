export type BillingRecord = { amount?: number; status?: string };

export function billingMetrics(invoices: BillingRecord[]) {
  const amount = (invoice: BillingRecord) => (
    typeof invoice.amount === "number" && Number.isFinite(invoice.amount) && invoice.amount > 0
      ? invoice.amount
      : 0
  );
  const sum = (items: BillingRecord[]) => Math.round(items.reduce((total, invoice) => total + amount(invoice), 0) * 100) / 100;
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const outstanding = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "void" && invoice.status !== "refunded");
  return {
    invoiceCount: invoices.length,
    outstandingAmount: sum(outstanding),
    paidAmount: sum(paid),
    totalAmount: sum(invoices.filter((invoice) => invoice.status !== "void")),
  };
}
