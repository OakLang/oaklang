"use client";

import type { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileUserIcon, LayoutIcon, UsersIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export default function AdminSidebar() {
  const pathname = usePathname();
  const menu: {
    id: string;
    title?: string;
    items: {
      title: string;
      url: string;
      exact?: boolean;
      icon: FC;
    }[];
  }[] = [
    {
      id: "main",
      items: [
        {
          icon: LayoutIcon,
          title: "Overview",
          url: `/admin`,
          exact: true,
        },
      ],
    },
    {
      id: "users",
      title: "Users",
      items: [
        {
          icon: UsersIcon,
          title: "Users",
          url: `/admin/users`,
        },
        {
          icon: FileUserIcon,
          title: "Access Requests",
          url: `/admin/access-requests`,
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarContent>
        <div className="flex h-16 items-center px-4">
          <p className="font-semibold">Admin Panel</p>
        </div>
        {menu.map((group) => (
          <SidebarGroup key={group.id}>
            {group.title && (
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.exact
                          ? pathname === item.url
                          : pathname.startsWith(item.url)
                      }
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
