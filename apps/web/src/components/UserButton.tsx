"use client";

import { LayoutIcon, LogOutIcon, SettingsIcon, UserIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import PrefetchLink from "./PrefetchLink";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

export default function UserButton({
  languageCode,
}: {
  languageCode?: string;
}) {
  const t = useTranslations("App");
  const { data, status } = useSession();

  if (status != "authenticated") {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="rounded-full">
          <Avatar>
            <AvatarFallback>
              <UserIcon className="h-5 w-5" />
            </AvatarFallback>
            {data.user.image ? <AvatarImage src={data.user.image} /> : null}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <div className="p-2">
          <p className="text-muted-foreground text-sm">{t("signed-in-as")}</p>
          <p className="font-medium">{data.user.email}</p>
        </div>

        <DropdownMenuSeparator />
        {data.user.role === "admin" && (
          <DropdownMenuItem asChild>
            <PrefetchLink href="/admin">
              <LayoutIcon className="mr-2 h-4 w-4" />
              Admin
            </PrefetchLink>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <PrefetchLink href="/app">
            <LayoutIcon className="mr-2 h-4 w-4" />
            Dashboard
          </PrefetchLink>
        </DropdownMenuItem>
        {languageCode && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <PrefetchLink href={`/app/${languageCode}/settings`}>
                <SettingsIcon className="mr-2 h-4 w-4" />
                {t("settings")}
              </PrefetchLink>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            localStorage.clear();
          }}
        >
          <LogOutIcon className="mr-2 h-4 w-4" />
          {t("log-out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
