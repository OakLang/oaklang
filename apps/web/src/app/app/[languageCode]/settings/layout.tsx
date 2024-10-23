import type { ReactNode } from "react";

import type { LanguageCodeParams } from "~/types";
import SideBar from "./side-bar";

export default async function SettingsLayout(
  props: Readonly<{ children: ReactNode; params: Promise<LanguageCodeParams> }>,
) {
  const { children, params } = props;
  const { languageCode } = await params;

  return (
    <>
      <SideBar languageCode={languageCode} />
      <div className="ml-64">{children}</div>
    </>
  );
}
