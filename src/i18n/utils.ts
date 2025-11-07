import i18n from './config';

/**
 * Format amount in FCFA
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(i18n.language, {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date according to current language
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Format number (rooms, area, etc.)
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat(i18n.language).format(num);
};
