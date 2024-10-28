import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import UserButton from "~/components/UserButton";

export default function AppBar({
  title,
  children,
  backHref,
}: {
  title: string;
  children?: ReactNode;
  backHref?: string;
}) {
  return (
    <header className="bg-background sticky top-0 z-20 flex h-16 items-center px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-4 h-8" />
      {backHref && (
        <Button asChild size="icon" variant="ghost" className="mr-4">
          <Link href={backHref}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        </Button>
      )}
      <p className="font-medium">{title}</p>
      <div className="flex flex-1 items-center justify-end gap-2">
        {children}
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
