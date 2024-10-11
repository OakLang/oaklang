import type { ReactNode } from "react";

import type { PracticeLanguageParams } from "~/types";
import SideBar from "./side-bar";

export default function SettingsLayout({
  children,
  params,
}: Readonly<{ children: ReactNode; params: PracticeLanguageParams }>) {
  return (
    <>
      <SideBar practiceLanguage={params.practiceLanguage} />
      <div className="ml-64">{children}</div>
    </>
  );
}
