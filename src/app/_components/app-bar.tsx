import Image from 'next/image';
import Link from 'next/link';
import UserDropdownMenu from './user-dropdown-menu';
import { cn } from '~/utils';

export default function AppBar({ fullWidth }: { fullWidth?: boolean }) {
  return (
    <div className="header top-0 z-20 h-16 border-b bg-card max-md:sticky">
      <div
        className={cn('flex h-full items-center px-4', {
          'container max-w-screen-xl': !fullWidth,
        })}
      >
        <div className="flex-1">
          <Link
            className="relative -left-2 block h-12 w-12 rounded-md px-1 py-4 text-lg font-bold text-foreground hover:bg-accent"
            href="/home"
          >
            <Image alt="wonderful.dev" height={98} src="/logo.svg" width={241} />
          </Link>
        </div>
        <div className="flex items-center justify-end gap-4">
          <UserDropdownMenu />
        </div>
      </div>
    </div>
  );
}
