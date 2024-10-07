"use server";

import { cookies } from "next/headers";

import type { Locale } from "~/i18n/config";
import { defaultLocale } from "~/i18n/config";

const COOKIE_NAME = "NEXT_LOCALE";

// eslint-disable-next-line @typescript-eslint/require-await
export const getLocale = async () => {
  return cookies().get(COOKIE_NAME)?.value ?? defaultLocale;
};

// eslint-disable-next-line @typescript-eslint/require-await
export const setLocale = async (locale: Locale) => {
  cookies().set(COOKIE_NAME, locale);
};
