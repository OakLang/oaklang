import "~/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import HolyLoader from "holy-loader";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";

import { auth } from "@acme/auth";

import ListenForTooltipHotkey from "~/components/ListenForTooltipHotkey";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { cn } from "~/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    env.NODE_ENV === "production"
      ? "https://oaklang.com"
      : "http://localhost:3000",
  ),
  title: "Oaklang",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground flex min-h-screen flex-col",
          inter.className,
        )}
        suppressHydrationWarning
      >
        <ListenForTooltipHotkey />
        <HolyLoader color="#2666FF" height={3} showSpinner={false} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider session={session}>
            <TRPCReactProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              >
                <TooltipProvider>{children}</TooltipProvider>
                <Toaster />
              </ThemeProvider>
            </TRPCReactProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
