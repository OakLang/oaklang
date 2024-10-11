import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui/button";
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
    <header className="sticky top-0 flex h-16 items-center border-b px-4">
      {backHref && (
        <Button asChild size="icon" variant="ghost" className="mr-4">
          <Link href={backHref}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
        </Button>
      )}
      <p className="text-lg font-semibold">{title}</p>
      <div className="flex flex-1 items-center justify-end gap-2">
        {children}
        <ThemeToggle />
        <UserButton />
      </div>
    </header>
  );
}
