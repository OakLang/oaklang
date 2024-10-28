import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import SettingsSidebar from "./sidebar";

export default function SettingsLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <SidebarProvider>
      <SettingsSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
