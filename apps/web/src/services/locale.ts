"use server";

import { cookies } from "next/headers";

import type { Locale } from "~/i18n/config";
import { defaultLocale } from "~/i18n/config";

const COOKIE_NAME = "NEXT_LOCALE";

export const getLocale = async () => {
  return (await cookies()).get(COOKIE_NAME)?.value ?? defaultLocale;
};

export const setLocale = async (locale: Locale) => {
  (await cookies()).set(COOKIE_NAME, locale);
};
