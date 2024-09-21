import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { INTERFACE_LANGUAGES } from "~/utils/constants";

export default function LanguageLayout({
  params,
  children,
}: {
  children: ReactNode;
  params: { language: string };
}) {
  if (!INTERFACE_LANGUAGES.includes(params.language)) {
    notFound();
  }

  return children;
}
