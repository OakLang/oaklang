"use client";

import { LogOutIcon, UserIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

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

export default function UserButton() {
  const { data, status } = useSession({ required: true });
  if (status === "loading") {
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
      <DropdownMenuContent>
        <div className="p-2">
          <p className="text-muted-foreground text-sm">Signed in as</p>
          <p className="font-medium">{data.user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOutIcon className="mr-2 h-4 w-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
