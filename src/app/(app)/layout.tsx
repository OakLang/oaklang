import type { ReactNode } from 'react';
import AppBar from 'src/app/_components/app-bar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppBar />
      {children}
    </>
  );
}
