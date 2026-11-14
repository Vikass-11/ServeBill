/**
 * Comprehensive Date Utility for Catering Pro
 * Handles:
 * - Indian locale date strings: "DD/MM/YYYY", "DD-MM-YYYY", "D/M/YYYY"
 * - ISO date strings: "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss.sssZ"
 * - Numeric epoch millisecond timestamps (numbers or string representation)
 * - Native Date objects
 */

export function parseSafeDate(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }

  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) return null;

    // Numeric epoch timestamp string e.g. "1731555555555"
    if (/^\d{11,14}$/.test(trimmed)) {
      const d = new Date(parseInt(trimmed, 10));
      if (!isNaN(d.getTime())) return d;
    }

    // Match DD/MM/YYYY or DD-MM-YYYY (e.g. "14/11/2026", "14-11-2026", "5/8/2026")
    const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1; // JS 0-indexed month
      let year = parseInt(dmyMatch[3], 10);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // Match YYYY-MM-DD or YYYY/MM/DD (e.g. "2026-11-14")
    const ymdMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // Fallback standard parse
    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) return fallback;
  }

  return null;
}

export function isSameDay(date1, date2) {
  const d1 = parseSafeDate(date1);
  const d2 = parseSafeDate(date2);
  if (!d1 || !d2) return false;
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

export function isSameMonth(date1, month, year) {
  const d = parseSafeDate(date1);
  if (!d) return false;
  return d.getMonth() === month && d.getFullYear() === year;
}

export function formatDateSafe(dateVal, locale = 'en-GB', options = undefined) {
  const d = parseSafeDate(dateVal);
  if (!d) return dateVal ? String(dateVal) : '';
  return d.toLocaleDateString(locale, options);
}
