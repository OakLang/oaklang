import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
