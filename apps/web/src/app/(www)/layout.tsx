import type { ReactNode } from "react";

import Footer from "./footer";
import NavBar from "./nav-bar";

export default function BaseLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <NavBar />
      <div className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
