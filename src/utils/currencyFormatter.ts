/**
 * Format a number as currency based on the current locale
 */
export function formatCurrency(amount: number, currency: string): string {
  // Currency symbols mapping
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CNY: "¥",
    JPY: "¥",
    XOF: "CFA",
    NGN: "₦",
    GHS: "₵",
    KES: "KSh",
    ZAR: "R",
    CAD: "C$",
    AUD: "A$",
    NZD: "NZ$",
    CHF: "CHF",
    HKD: "HK$",
    SGD: "S$",
    TWD: "NT$",
    MXN: "MX$",
    ARS: "AR$",
    CLP: "CL$",
    COP: "CO$",
    PEN: "S/",
    VES: "Bs",
    GNF: "FG",
  };

  const symbol = currencySymbols[currency] || currency;

  // Format number with appropriate separators
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  // For some currencies, symbol goes after the amount
  const symbolAfter = ["XOF", "GNF", "KES"];

  if (symbolAfter.includes(currency)) {
    return `${formattedAmount} ${symbol}`;
  }

  return `${symbol}${formattedAmount}`;
}

/**
 * Format a large number with suffix (K, M, B) and convert to target currency
 * Base amount is assumed to be in USD
 */
export function formatLargeNumber(
  amountUSD: number,
  targetCurrency: string,
): string {
  // Convert from USD to target currency
  const convertedAmount = convertCurrency(amountUSD, "USD", targetCurrency);

  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CNY: "¥",
    XOF: "CFA",
    NGN: "₦",
    GHS: "₵",
    KES: "KSh",
    ZAR: "R",
    CAD: "C$",
    AUD: "A$",
    HKD: "HK$",
    TWD: "NT$",
    MXN: "MX$",
  };

  const symbol = currencySymbols[targetCurrency] || targetCurrency;

  // Format with appropriate suffix
  if (convertedAmount >= 1000000000) {
    const value = (convertedAmount / 1000000000).toFixed(1);
    return targetCurrency === "XOF"
      ? `${value}Mrd ${symbol}`
      : `${symbol}${value}B`;
  }
  if (convertedAmount >= 1000000) {
    const value = (convertedAmount / 1000000).toFixed(0);
    return targetCurrency === "XOF"
      ? `${value}M ${symbol}`
      : `${symbol}${value}M`;
  }
  if (convertedAmount >= 1000) {
    const value = (convertedAmount / 1000).toFixed(0);
    return targetCurrency === "XOF"
      ? `${value}K ${symbol}`
      : `${symbol}${value}K`;
  }
  return targetCurrency === "XOF"
    ? `${convertedAmount} ${symbol}`
    : `${symbol}${convertedAmount}`;
}

/**
 * Convert amount from one currency to another
 * Base rates are relative to 1 USD (as of 2025)
 * In production, use a real-time exchange rate API like exchangerate-api.com
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  if (fromCurrency === toCurrency) return amount;

  // Exchange rates relative to 1 USD (approximate rates for 2025)
  const exchangeRates: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    CNY: 7.24, // Chinese Yuan
    JPY: 149, // Japanese Yen
    XOF: 603.5, // West African CFA Franc (Pegged to EUR: 655.957 * 0.92)
    NGN: 1540, // Nigerian Naira
    GHS: 15.5, // Ghanaian Cedi
    KES: 129, // Kenyan Shilling
    ZAR: 18.5, // South African Rand
    CAD: 1.36, // Canadian Dollar
    AUD: 1.53, // Australian Dollar
    NZD: 1.67, // New Zealand Dollar
    CHF: 0.88, // Swiss Franc
    HKD: 7.83, // Hong Kong Dollar
    SGD: 1.34, // Singapore Dollar
    TWD: 31.5, // Taiwan Dollar
    MXN: 17.2, // Mexican Peso
    ARS: 1000, // Argentine Peso
    CLP: 950, // Chilean Peso
    COP: 4200, // Colombian Peso
    PEN: 3.75, // Peruvian Sol
    VES: 36, // Venezuelan Bolivar
    GNF: 8600, // Guinean Franc
  };

  const fromRate = exchangeRates[fromCurrency] || 1;
  const toRate = exchangeRates[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}
