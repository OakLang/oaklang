import type { ReactNode } from "react";
import { Fragment } from "react";

import { ThemeToggle } from "~/components/ThemeToggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import UserButton from "~/components/UserButton";

export default function AppBar({
  children,
  breadcrumb,
  pageTitle,
}: {
  children?: ReactNode;
  breadcrumb?: {
    href?: string;
    title: string;
  }[];
  pageTitle: string;
}) {
  return (
    <header className="bg-background sticky top-0 z-20 flex h-16 items-center border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-4 h-8" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumb?.map((item) => {
            return (
              <Fragment key={item.title}>
                <BreadcrumbItem>
                  <BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </Fragment>
            );
          })}
          <BreadcrumbItem>
            <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-1 items-center justify-end gap-2">
        {children}
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
