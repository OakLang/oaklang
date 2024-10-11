import type { ReactNode } from "react";
import { FileUserIcon, LayoutIcon, UsersIcon } from "lucide-react";

import type { SideBarMenuItem } from "~/components/SideBarMenu";
import SideBarMenu from "~/components/SideBarMenu";
import { HydrateClient } from "~/trpc/server";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <HydrateClient>
      <SideBar />
      <div className="ml-64">{children}</div>
    </HydrateClient>
  );
}

function SideBar() {
  const menu: SideBarMenuItem[] = [
    {
      icon: <LayoutIcon />,
      name: "Overview",
      href: `/admin`,
      exact: true,
    },
    {
      icon: <UsersIcon />,
      name: "Users",
      href: `/admin/users`,
    },
    {
      icon: <FileUserIcon />,
      name: "Access Requests",
      href: `/admin/access-requests`,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 top-0 w-64 flex-shrink-0 overflow-y-auto border-r">
      <header className="flex h-14 items-center px-8">
        <h1 className="text-lg font-semibold">Admin Panel</h1>
      </header>
      <SideBarMenu data={menu} />
    </div>
  );
}
