import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFirstRow = <T>(rows: T[]) => (rows.length > 0 ? rows[0] : null);

export const roundWithPrecision = (n: number, precision = 2) => {
  const factor = Math.pow(10, precision);
  return Math.round(n * factor + Number.EPSILON) / factor;
};

export const parseNumber = (s: string) => {
  s = s.toLowerCase().trim();
  if (s.length < 2) {
    return parseInt(s);
  }

  // convert from EU-style (4.000,00) to US-style (4,000.00) then remove commas
  if (s.match(/,\d\d?\w?$/)) {
    s = s.replaceAll('.', '').replaceAll(',', '.');
  }
  s = s.replaceAll(',', '');

  const ending = s.charAt(s.length - 1);
  const trimmed = s.slice(0, -1).trimEnd();
  switch (ending) {
    case 'k':
      return parseFloat(trimmed) * 1000;
    case 'm':
      return parseFloat(trimmed) * 1000 * 1000;
    case 'b':
      return parseFloat(trimmed) * 1000 * 1000 * 1000;
    case 't':
      return parseFloat(trimmed) * 1000 * 1000 * 1000 * 1000;
    case 'q':
      return parseFloat(trimmed) * 1000 * 1000 * 1000 * 1000 * 1000;
    default:
      return parseFloat(s);
  }
};

export const formatNumberWithSuffix = (
  i: number,
  suffix: string,
  opts?: { plural?: string; precision?: number; round?: boolean },
): string => {
  const formatted = formatNumber(i, { precision: opts?.precision, round: opts?.round });
  const s = getSuffixForNumber(i, suffix, opts);
  return `${formatted} ${s}`;
};

export const formatNumber = (i: number, opts?: { long?: boolean; precision?: number; round?: boolean }): string => {
  if (isNaN(i)) {
    i = 0;
  }

  let formatted = i.toLocaleString('en-US');
  if (opts?.long) {
    return formatted;
  }

  const round = (opts?.round && (opts.precision ?? 1) > 0) ?? (opts?.precision ?? 1) > 0;

  let unit = '';
  let divisor = 0;
  if (i < 1000000) {
    if (i > 999) {
      unit = 'K';
      divisor = 1000;
    }
  } else {
    divisor = 1000000;
    unit = 'M';
  }

  if (divisor > 0) {
    if (round) {
      formatted = roundWithPrecision(i / divisor, opts?.precision ?? (Math.floor(i / divisor) < 2 ? 2 : 1)).toLocaleString('en-US');
    } else {
      formatted = (i / divisor).toLocaleString('en-US');
    }
  } else if (round) {
    if (formatted.split('.').length > 1) {
      formatted = roundWithPrecision(i, opts?.precision ?? (Math.floor(i) < 2 ? 2 : 1)).toLocaleString('en-US');
    }
  }

  return `${formatted}${unit}`;
};

export const getSuffixForNumber = (i: number, suffix: string, opts?: { plural?: string }): string => {
  if (isNaN(i)) {
    i = 0;
  }
  i = Math.floor(i);
  const plural = opts?.plural ?? `${suffix}s`;
  return i === 1 ? suffix : plural;
};
