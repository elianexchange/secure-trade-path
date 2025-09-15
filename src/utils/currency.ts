// Currency utilities for Tranzio platform
// Primary currency: NGN (Nigerian Naira)
// Secondary currencies: GHS (Ghana Cedis), KES (Kenya Shilling), ZAR (South Africa Rand)

export type Currency = 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'USD' | 'EUR';

export const CURRENCIES: Record<Currency, { symbol: string; name: string; country: string }> = {
  NGN: { symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  GHS: { symbol: '₵', name: 'Ghana Cedi', country: 'Ghana' },
  KES: { symbol: 'KSh', name: 'Kenya Shilling', country: 'Kenya' },
  ZAR: { symbol: 'R', name: 'South Africa Rand', country: 'South Africa' },
  USD: { symbol: '$', name: 'US Dollar', country: 'United States' },
  EUR: { symbol: '€', name: 'Euro', country: 'European Union' }
};

export const DEFAULT_CURRENCY: Currency = 'NGN';

/**
 * Format currency amount with proper symbol and formatting
 */
export function formatCurrency(amount: number, currency: Currency = DEFAULT_CURRENCY): string {
  const currencyInfo = CURRENCIES[currency];
  
  if (currency === 'NGN') {
    // Nigerian Naira formatting (₦1,234,567.89)
    return `${currencyInfo.symbol}${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  if (currency === 'GHS') {
    // Ghana Cedi formatting (₵1,234.56)
    return `${currencyInfo.symbol}${amount.toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  if (currency === 'KES') {
    // Kenya Shilling formatting (KSh 1,234.56)
    return `${currencyInfo.symbol} ${amount.toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  if (currency === 'ZAR') {
    // South Africa Rand formatting (R 1,234.56)
    return `${currencyInfo.symbol} ${amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
  
  // Default formatting for USD/EUR
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format currency amount in compact form (e.g., ₦1.2M, ₵500K)
 */
export function formatCompactCurrency(amount: number, currency: Currency = DEFAULT_CURRENCY): string {
  const currencyInfo = CURRENCIES[currency];
  
  if (amount >= 1000000) {
    const millions = (amount / 1000000).toFixed(1);
    return `${currencyInfo.symbol}${millions}M`;
  }
  
  if (amount >= 1000) {
    const thousands = (amount / 1000).toFixed(1);
    return `${currencyInfo.symbol}${thousands}K`;
  }
  
  return formatCurrency(amount, currency);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency = DEFAULT_CURRENCY): string {
  return CURRENCIES[currency].symbol;
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: Currency = DEFAULT_CURRENCY): string {
  return CURRENCIES[currency].name;
}

/**
 * Get country name for currency
 */
export function getCurrencyCountry(currency: Currency = DEFAULT_CURRENCY): string {
  return CURRENCIES[currency].country;
}

/**
 * Convert amount between currencies (basic conversion rates)
 * Note: In production, use real-time exchange rate APIs
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: Currency, 
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Basic conversion rates (should be replaced with real-time rates)
  const rates: Record<Currency, number> = {
    NGN: 1,      // Base currency
    GHS: 0.0012, // 1 NGN = 0.0012 GHS
    KES: 0.15,   // 1 NGN = 0.15 KES
    ZAR: 0.012,  // 1 NGN = 0.012 ZAR
    USD: 0.00066, // 1 NGN = 0.00066 USD
    EUR: 0.00061  // 1 NGN = 0.00061 EUR
  };
  
  // Convert to NGN first, then to target currency
  const inNGN = amount / rates[fromCurrency];
  return inNGN * rates[toCurrency];
}
