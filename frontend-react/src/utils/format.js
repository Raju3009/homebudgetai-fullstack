export function getCurrency() {
  return window.localStorage.getItem('homebudgetai.currency') || 'USD';
}

export function formatCurrency(value, currency = getCurrency()) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
  } catch {
    return `${currency} ${Number(value || 0).toFixed(2)}`;
  }
}

export function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, options).format(date);
}

export function dateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function dateOnlyToUtc(value) {
  return value ? `${value}T00:00:00.000Z` : '';
}

export function initials(name = 'Home Budget') {
  return name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'HB';
}
