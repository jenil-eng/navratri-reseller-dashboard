/**
 * Formats a number to Indian Rupee representation (e.g., ₹1,999 or ₹25,000)
 */
export function formatRupee(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Formats date ISO or YYYY-MM-DD string to DD-MM-YYYY
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  // If already DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats date object to YYYY-MM-DD input default value without UTC timezone shift
 */
export function getTodayInputDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Badge styling for Pass Given status
 */
export function getPassGivenBadgeProps(status) {
  const clean = String(status || '').trim().toLowerCase();
  if (clean === 'yes') {
    return {
      label: 'Yes',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20'
    };
  }
  if (clean === 'partially') {
    return {
      label: 'Partially',
      className: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20'
    };
  }
  return {
    label: 'No',
    className: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20'
  };
}

/**
 * Badge styling for Profit
 */
export function getProfitBadgeProps(profit) {
  const num = Number(profit) || 0;
  if (num > 0) {
    return {
      className: 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold',
      indicator: '+'
    };
  }
  if (num < 0) {
    return {
      className: 'text-rose-700 bg-rose-50 border border-rose-200 font-semibold',
      indicator: ''
    };
  }
  return {
    className: 'text-slate-600 bg-slate-100 border border-slate-200 font-medium',
    indicator: ''
  };
}
