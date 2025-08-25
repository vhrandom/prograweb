export function formatPrice(cents: number, currency = "CLP"): string {
  const amount = cents / 100;
  
  if (currency === "CLP") {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function parsePrice(priceString: string): number {
  // Remove all non-numeric characters except decimal points
  const numericString = priceString.replace(/[^\d.,]/g, "");
  
  // Convert to number and then to cents
  const amount = parseFloat(numericString.replace(",", "."));
  return Math.round(amount * 100);
}
