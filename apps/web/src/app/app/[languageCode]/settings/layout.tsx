import type { ReactNode } from "react";

import type { LanguageCodeParams } from "~/types";
import SideBar from "./side-bar";

export default function SettingsLayout({
  children,
  params: { languageCode },
}: Readonly<{ children: ReactNode; params: LanguageCodeParams }>) {
  return (
    <>
      <SideBar languageCode={languageCode} />
      <div className="ml-64">{children}</div>
    </>
  );
}
