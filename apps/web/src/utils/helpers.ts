import { formatDistanceStrict } from 'date-fns';

export const getLinksFromResponse = (response: Response): Map<string, string> => {
  return new Map<string, string>(
    response.headers
      .get('Link')
      ?.split(',')
      .map((link) => link.match(/<(?<url>[^>]+)>; rel="(?<rel>[^"]+)"/))
      .filter((match) => {
        return match?.groups?.rel && match.groups.url;
      })
      .map((match) => [match?.groups?.rel ?? '', match?.groups?.url ?? '']) ?? [],
  );
};

export const pagify = (total: number, page: number, limit = 20) => {
  const pageV = Math.round(page) > 0 ? Math.round(page) : 1;
  const offset = (pageV - 1) * limit;
  return {
    limit,
    nextPage: pageV * limit >= total ? null : pageV + 1,
    offset,
    page: pageV,
    prevPage: pageV - 1 > 0 ? pageV - 1 : null,
    total,
    totalPages: Math.ceil(total / limit),
  };
};

export const pagesRange = (totalPages: number, page: number) => {
  let start = page - 2;
  if (start < 1) {
    start = 1;
  }
  let end = start + 4;
  if (end > totalPages) {
    end = totalPages;
    start = end - 4;
    if (start < 1) {
      start = 1;
    }
  }
  return range(start, end);
};

export const range = (start: number, end: number): number[] => {
  if (start == end) {
    return [start];
  }
  return [start, ...range(start + 1, end)];
};

export const firstCharUppercase = (s?: string) => {
  if (!s) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const parseFirstName = (name: string) => {
  const re = new RegExp(/[^a-zA-Z]/g);
  const parts = name.split('.');
  if (parts.length > 1) {
    if ((parts[0]?.trim().length ?? 0) <= 3) {
      return firstCharUppercase(parts[1]?.trim().split(' ')[0])?.replace(re, '');
    }
    return firstCharUppercase(parts[0]?.trim().split(' ')[0])?.replace(re, '');
  } else {
    return firstCharUppercase(name.split(' ')[0])?.replace(re, '');
  }
};

export const truncate = (s: string, maxlen = 60) => {
  if (typeof s !== 'string') {
    return s;
  }
  return s.length < maxlen ? s : `${s.substring(0, maxlen - 1)}…`;
};

export const relativeDate = (date: Date) => {
  return formatDistanceStrict(date, new Date(), { addSuffix: true });
};

export const roundToMostSignificantDigit = (n: number) => {
  if (n < 1000) {
    return 0;
  }
  const denominator = Math.pow(10, Math.floor(Math.abs(n)).toString().length - 1);
  return Math.floor(n / denominator) * denominator;
};

export const extractWords = (paragraph: string) => {
  const matches = paragraph.match(/\b\w+\b/g) ?? [];
  const lexicons = matches.map((match) => match.trim());
  return lexicons;
};

export const extractComaSeperatedWords = (input: string) => {
  const matches = input.match(/(?<=,|^)\s*([^,]+)/g) ?? [];
  const lexicons = matches.map((match) => match.trim());
  return lexicons;
};
