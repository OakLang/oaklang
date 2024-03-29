'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { PublicUser } from '~/utils/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { RefetchOptions, RefetchQueryFilters } from '@tanstack/react-query';
import { LuLoader2 } from 'react-icons/lu';
import { api } from '~/trpc/client';

const authRequiredPaths: { exact?: boolean; href: string }[] = [
  { href: '/home' },
  { href: '/explore' },
  { href: '/search' },
  { href: '/onboard' },
  { href: '/connect-people' },
  { href: '/settings' },
  { href: '/admin' },
];

export type AuthContext = {
  currentUser: PublicUser | null;
  isAuthenticated: boolean | undefined;
  isLoading: boolean;
  refetch?: <TPageData>(options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined) => unknown;
  signOut: () => Promise<void>;
};

const context = createContext<AuthContext | null>(null);

export function AuthProvider({
  children,
  currentUser: initialCurrentUser,
}: {
  children: React.ReactNode;
  currentUser?: PublicUser | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userQuery = api.auth.currentUser.useQuery(undefined, {
    initialData: initialCurrentUser,
    retry: false,
  });
  const signOutMut = api.auth.signout.useMutation();
  const isAuthRequiredRoute = useMemo(
    () => authRequiredPaths.findIndex((path) => (path.exact ? path.href === pathname : pathname.startsWith(path.href))) !== -1,
    [pathname],
  );

  const signOut = useCallback(async () => {
    await signOutMut.mutateAsync();
    router.push('/');
    router.refresh();
  }, [router, signOutMut]);

  useEffect(() => {
    if (!userQuery.isSuccess) {
      return;
    }
    if (isAuthRequiredRoute && !userQuery.data) {
      const params = new URLSearchParams({
        next: `${pathname}?${searchParams.toString()}`,
      });
      router.replace(`/flow/login?${params.toString()}`);
    }
  }, [isAuthRequiredRoute, pathname, router, searchParams, userQuery.data, userQuery.isSuccess]);

  if (isAuthRequiredRoute && (!userQuery.isSuccess || !userQuery.data)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <LuLoader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <context.Provider
      value={{
        currentUser: userQuery.data ?? null,
        isAuthenticated: !!userQuery.data,
        isLoading: userQuery.isLoading,
        refetch: userQuery.refetch,
        signOut,
      }}
    >
      {children}
    </context.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(context);
  if (!ctx) {
    throw new Error('useAuth must use insdie AuthProvider');
  }
  return ctx;
}
