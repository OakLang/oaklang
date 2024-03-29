'use client';

import Link from 'next/link';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { APP_NAME } from '~/utils/constants';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/providers/AuthProvider';
import { LuLoader2 } from 'react-icons/lu';
import SuggestedUsersWidget from '~/components/sidebar-widgets/suggested-users-widget';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import SearchWidget from '~/components/sidebar-widgets/search-widget';
import { HiOutlineExternalLink } from 'react-icons/hi';

type MatchPath = { exact?: boolean; href: string };
const HIDE_SEARCHBAR_PATHS: MatchPath[] = [{ href: '/explore' }, { href: '/search' }];
const HIDE_USER_SUGGESTION_PATHS: MatchPath[] = [{ href: '/connect-people' }];
const HIDE_SIDE_BAR_PATHS: MatchPath[] = [];

const getMatch = (paths: MatchPath[], pathname: string) => {
  const index = paths.findIndex((path) => (path.exact ? path.href === pathname : pathname.startsWith(path.href)));
  return index !== -1;
};

export default function RightSideBar() {
  const { currentUser, isLoading } = useAuth();
  const pathname = usePathname();
  const showSearchBar = useMemo(() => !getMatch(HIDE_SEARCHBAR_PATHS, pathname), [pathname]);
  const showSuggestedUsers = useMemo(() => !getMatch(HIDE_USER_SUGGESTION_PATHS, pathname), [pathname]);
  const showSideBar = useMemo(() => !getMatch(HIDE_SIDE_BAR_PATHS, pathname), [pathname]);

  if (!showSideBar) {
    return null;
  }

  return (
    <div className="w-80 flex-shrink-0 max-md:hidden xl:w-96">
      <div className="sticky top-0 space-y-4 p-4">
        {isLoading ? (
          <Card className="flex h-32 items-center justify-center">
            <LuLoader2 className="h-6 w-6 animate-spin" />
          </Card>
        ) : currentUser ? (
          showSearchBar ? (
            <SearchWidget />
          ) : null
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>New to {APP_NAME}?</CardTitle>
              <CardDescription>Sign Up now to get see all your friend&apos;s activity</CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col items-stretch gap-2">
              <Button asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                By signing up, you agree to the{' '}
                <Link className="font-semibold hover:text-foreground hover:underline" href="/terms">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link className="font-semibold hover:text-foreground hover:underline" href="/privacy">
                  Privacy Policy
                </Link>
                .
              </p>
            </CardFooter>
          </Card>
        )}
        {showSuggestedUsers ? <SuggestedUsersWidget /> : null}
        <div className="text-sm">
          <p className="text-muted-foreground">
            <span>
              Powered by{' '}
              <Link
                className="font-medium text-muted-foreground hover:text-foreground hover:underline"
                href="https://wakatime.com"
                rel="nofollow noopener"
                target="_blank"
              >
                WakaTime <HiOutlineExternalLink className="inline h-4 w-4" />
              </Link>
            </span>
            <Link className="ml-2 font-medium text-muted-foreground hover:text-foreground hover:underline" href="/terms">
              Terms
            </Link>
            <Link className="ml-2 font-medium text-muted-foreground hover:text-foreground hover:underline" href="/privacy">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
