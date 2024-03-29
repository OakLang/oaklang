import type { ReactNode } from 'react';
import AppSideBar from './_components/side-bar';
import RightSideBar from './_components/right-side-bar';
import TabBar from './_components/tab-bar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="container flex max-w-screen-xl flex-1">
        <AppSideBar />
        <div className="flex-1 overflow-hidden md:border-x">{children}</div>
        <RightSideBar />
      </div>
      <TabBar />
    </>
  );
}
