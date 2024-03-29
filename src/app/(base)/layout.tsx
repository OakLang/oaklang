import type { ReactNode } from 'react';
import NavBar from './_components/nav-bar';
import Footer from './_components/footer';

export default function BaseLayout({ children }: { children: ReactNode }) {
  return (
    <div className="polka flex min-h-screen flex-col">
      <NavBar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
