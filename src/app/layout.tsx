import 'core-js/features/array/to-reversed';
import 'core-js/features/array/to-spliced';
import 'core-js/features/array/to-sorted';
import '~/styles/globals.css';
import { TooltipProvider } from '~/components/ui/tooltip';
import ThemeProvider from '~/providers/ThemeProvider';
import { cn } from '~/utils';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { APP_NAME } from '~/utils/constants';
import HolyLoader from 'holy-loader';
import { TrpcProvider } from '~/providers/TrpcProvider';
import { SessionProvider } from 'next-auth/react';
import { auth } from '~/lib/auth';
import { Toaster } from '~/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: APP_NAME,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={cn('flex min-h-screen flex-col bg-background text-foreground', inter.className)}>
        <HolyLoader color="#2666FF" height={3} showSpinner={false} />
        <TrpcProvider>
          <ThemeProvider>
            <TooltipProvider>
              <SessionProvider session={session}>{children}</SessionProvider>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </TrpcProvider>
      </body>
    </html>
  );
}
