import { RedirectType, redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getUser } from '~/utils/server-auth';
import AdminSideBar from './_components/side-bar';
import AppBar from '~/app/_components/app-bar';
import type { Metadata } from 'next';
import { isAdmin } from '~/utils/auth';

export const metadata: Metadata = {
  title: 'Admin',
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!isAdmin(user)) {
    redirect('/', RedirectType.replace);
  }

  return (
    <>
      <AppBar fullWidth />
      <div className="flex flex-1">
        <AdminSideBar />
        <div className="flex-1 overflow-hidden md:border-l">{children}</div>
      </div>
    </>
  );
}
