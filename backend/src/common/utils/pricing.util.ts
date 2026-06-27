const DEFAULT_VAT_PERCENT = 5;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateLinePricing(
  quantity: number,
  unitPrice: number,
  includeVat: boolean,
  vatPercent = DEFAULT_VAT_PERCENT,
) {
  const subtotal = roundMoney(quantity * unitPrice);
  const vatAmount = includeVat ? roundMoney(subtotal * (vatPercent / 100)) : 0;
  const lineTotal = roundMoney(subtotal + vatAmount);

  return { subtotal, vatAmount, lineTotal, vatPercent };
}
