"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { cn } from "~/utils";
import PrefetchLink from "./PrefetchLink";
import { Button } from "./ui/button";

export interface SideBarMenuItem {
  href: string;
  name: string;
  icon: ReactNode;
  exact?: boolean;
}

export interface SideBarMenuProps {
  data: SideBarMenuItem[];
}

export default function SideBarMenu({ data }: SideBarMenuProps) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1 p-4 pt-0">
      {data.map((item) => {
        const isActive = item.exact
          ? item.href === pathname
          : pathname.startsWith(item.href);
        return (
          <Button
            key={item.href}
            asChild
            className={cn(
              "text-muted-foreground flex items-center justify-start text-left",
              {
                "bg-secondary text-foreground": isActive,
              },
            )}
            variant="ghost"
          >
            <PrefetchLink href={item.href}>
              <span className="-ml-1 mr-2">{item.icon}</span>
              {item.name}
            </PrefetchLink>
          </Button>
        );
      })}
    </nav>
  );
}
