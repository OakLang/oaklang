import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '~/lib/auth';

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect('/home');
  }

  return (
    <div>
      <p>Welcome to Oaklang</p>
      <Link href="/login">Sign In</Link>
    </div>
  );
}
