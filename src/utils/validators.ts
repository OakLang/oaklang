import { BASE_URL } from './constants';
import { RESERVED_USERNAMES } from './reserved-usernames';
import { z } from 'zod';

const usernameStartPattern = new RegExp(/^[a-zA-Z]/);
const usernamePattern = new RegExp(/^[\w\d]+$/);

export interface Form {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
}

const emailSchema = z.string().min(1).email();
export const validateEmail = (email: string): Form => {
  if (emailSchema.safeParse(email).success) {
    return {
      data: email,
    };
  }

  return { error: 'Invalid email.' };
};

export const validateId = (id: string | undefined | null): Form => {
  const result = z.string().safeParse(id);
  if (!result.success) {
    return { error: result.error.message };
  }
  return { data: result.data };
};

export const validateUserProfileDefaultType = (dataType: string | undefined | null): Form => {
  const result = z.string().safeParse(dataType);
  if (!result.success) {
    return { error: result.error.message };
  }
  if (!['avatar', 'name'].includes(result.data)) {
    return { error: 'Invalid provider.' };
  }
  return { data: result.data };
};

export const validateUsername = (username: string | undefined | null): Form => {
  const result = z.string().safeParse(username);
  if (!result.success) {
    return { error: result.error.message };
  }
  const usernameStr = result.data;
  if (usernameStr.length > 0 && !usernameStartPattern.test(usernameStr)) {
    return { error: 'Must start with a letter.' };
  }
  if (usernameStr.length < 4) {
    return { error: 'Keep typing.' };
  }
  if (usernameStr.length > 16) {
    return { error: 'Too long.' };
  }
  if (usernameStr.indexOf(' ') > -1) {
    return { error: 'Spaces not allowed.' };
  }
  if (!usernamePattern.test(usernameStr)) {
    return { error: 'Invalid username.' };
  }
  if (RESERVED_USERNAMES.includes(usernameStr)) {
    return { error: 'Username not available.' };
  }
  return { data: usernameStr };
};

export function makeUrlSafe(url: unknown): string | null {
  const validator = z.string().url();
  try {
    validator.parse(url);
    const base = BASE_URL?.endsWith('/') ? BASE_URL : `${BASE_URL}/`;
    const urlStr = url as string;
    if (urlStr.startsWith(base)) {
      return urlStr.slice(0, base.length - 1);
    }
  } catch (e) {
    console.error(e);
    const regex = new RegExp(/^\/[\w/&$?@=-]+$/);
    const res = z
      .string()
      .refine((s) => regex.test(s))
      .safeParse(url);
    if (res.success) {
      return res.data;
    } else {
      console.error(res.error);
    }
  }
  return null;
}

export function isNonEmptyString(str: unknown): boolean {
  const validator = z.string().trim();
  try {
    validator.parse(str);
    return !!(str as string).trim();
  } catch (e) {
    // Log error?
  }
  return false;
}

export function parseJSONObject(data: unknown): object | null {
  if (!isNonEmptyString(data)) {
    return null;
  }
  try {
    const obj = JSON.parse(atob(data as string)) as unknown;
    if (typeof obj !== 'object') {
      return null;
    }
    return obj;
  } catch (e) {
    try {
      const obj = JSON.parse(data as string) as unknown;
      if (typeof obj !== 'object') {
        return null;
      }
      return obj;
    } catch (e) {
      /* ignore */
    }
  }
  return null;
}

export async function responseJSON(resp: Response, defval: unknown): Promise<unknown> {
  try {
    return (await resp.json()) as unknown;
  } catch (e) {
    return defval;
  }
}

export const timelineFilterOptions = z.object({
  integrations: z.array(z.string()).nullish(),
  languages: z.array(z.string()).nullish(),
});

export type TimelineFilterOptions = z.infer<typeof timelineFilterOptions>;

export const leadersFilterOptions = z.object({
  languages: z.array(z.string()).nullish(),
});

export type LeadersFilterOptions = z.infer<typeof leadersFilterOptions>;

export const createNewListSchema = z.object({
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  name: z.string().min(1).max(100),
});

export type CreateNewListDto = z.infer<typeof createNewListSchema>;

export const updateListSchema = z.object({
  description: z.string().max(500).optional(),
  id: z.string(),
  isPrivate: z.boolean().default(false).optional(),
  name: z.string().min(1).max(100).optional(),
});

export type UpdateListDto = z.infer<typeof updateListSchema>;
