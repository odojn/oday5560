export const getCurrencySymbol = (currencyCode: string) => {
  switch (currencyCode) {
    case 'ILS': return '₪';
    case 'USD': return '$';
    case 'JOD': return 'د.أ';
    case 'SAR': return 'ر.س';
    case 'TRY': return '₺';
    case 'EUR': return '€';
    case 'EGP': return 'ج.م';
    default: return '₪';
  }
};

export const formatCurrency = (amount: number, currencyCode: string = 'ILS') => {
  const symbol = getCurrencySymbol(currencyCode);
  // Always format numbers using en-US for English digits
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formattedNumber} ${symbol}`;
};

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};
