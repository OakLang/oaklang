import "core-js/features/array/to-reversed";
import "core-js/features/array/to-spliced";
import "core-js/features/array/to-sorted";
import "~/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import HolyLoader from "holy-loader";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

import { auth } from "@acme/auth";

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
  // description: "Simple monorepo with shared backend for web & mobile apps",
  // openGraph: {
  //   title: "Oaklang",
  //   description: "Simple monorepo with shared backend for web & mobile apps",
  //   url: "https://create-t3-turbo.vercel.app",
  //   siteName: "Oaklang",
  // },
  // twitter: {
  //   card: "summary_large_image",
  //   site: "@jullerino",
  //   creator: "@jullerino",
  // },
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

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground flex min-h-screen flex-col",
          inter.className,
        )}
      >
        <HolyLoader color="#2666FF" height={3} showSpinner={false} />
        <SessionProvider session={session}>
          <TRPCReactProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </ThemeProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
