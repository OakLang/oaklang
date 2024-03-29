/* eslint-disable react/jsx-max-depth */
import 'core-js/features/array/to-reversed';
import 'core-js/features/array/to-spliced';
import 'core-js/features/array/to-sorted';
import '~/styles/globals.css';

import { TooltipProvider } from '~/components/ui/tooltip';
import { Toaster } from '~/components/ui/toaster';
import ThemeProvider from '~/providers/ThemeProvider';
import TrpcProvider from '~/providers/TrpcProvider';
import { AuthProvider } from '~/providers/AuthProvider';
import { cn } from '~/utils';
import { Inter as FontSans } from 'next/font/google';
import { userToPublicUser } from '~/utils/backend';
import type { PublicUser } from '~/utils/types';
import { getUser } from '~/utils/server-auth';
import FocusSearchBarListener from '~/components/FocusSearchBarListener';
import type { Metadata } from 'next';
import { APP_NAME } from '~/utils/constants';
import HolyLoader from 'holy-loader';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: APP_NAME,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  let publicUser: PublicUser | null = null;
  if (user) {
    publicUser = await userToPublicUser(user);
  }
  return (
    <html lang="en">
      <body className={cn('flex min-h-screen flex-col bg-background font-sans antialiased', fontSans.variable)}>
        <HolyLoader color="#2666FF" height={3} showSpinner={false} />
        <TrpcProvider>
          <ThemeProvider>
            <TooltipProvider>
              <AuthProvider currentUser={publicUser}>{children}</AuthProvider>
            </TooltipProvider>
            <Toaster />
            <FocusSearchBarListener />
          </ThemeProvider>
        </TrpcProvider>
      </body>
    </html>
  );
}
