import type { ReactNode } from "react";

import SideBar from "./side-bar";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SideBar />
      <div className="ml-64">{children}</div>
    </>
  );
}
