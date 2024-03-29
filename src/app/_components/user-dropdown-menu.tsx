'use client';

import { Avatar, AvatarFallback, AvatarImage } from 'src/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { IoPersonOutline, IoSettingsOutline } from 'react-icons/io5';
import { Button } from 'src/components/ui/button';
import Link from 'next/link';
import { LuLogOut } from 'react-icons/lu';
import { Skeleton } from 'src/components/ui/skeleton';
import ThemeToggleDropdownItem from 'src/components/ThemeToggleDropdownItem';
import { useAuth } from '~/providers/AuthProvider';

export default function UserDropdownMenu() {
  const { currentUser, signOut, isLoading } = useAuth();
  if (isLoading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }
  if (!currentUser) {
    return null;
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className="cursor-pointer">
        <Button className="rounded-full" size="icon" variant="ghost">
          <Avatar>
            <AvatarImage src={currentUser.avatarUrl} />
            <AvatarFallback>
              <IoPersonOutline size={20} />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        <DropdownMenuItem asChild>
          <Link href={`/${currentUser.username ?? currentUser.id}`}>
            <IoPersonOutline className="mr-2" size={22} /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ThemeToggleDropdownItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={'/settings'}>
            <IoSettingsOutline className="mr-2" size={22} />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LuLogOut className="mr-2" size={22} />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
