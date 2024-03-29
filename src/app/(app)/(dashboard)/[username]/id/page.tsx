import { RedirectType, notFound, redirect } from 'next/navigation';
import { getUserByUsername } from '~/utils/server-auth';

type Props = {
  params: {
    username: string;
  };
};

export default async function UserIdPage({ params }: Props) {
  const user = await getUserByUsername(params.username);
  if (!user || !user.isActive) {
    notFound();
  }

  if (user.username && params.username.trim() !== user.username) {
    redirect(`/${user.username}/id`, RedirectType.replace);
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <h3>Your user id</h3>
      <pre className="mt-3">
        <code>{user.id}</code>
      </pre>
    </div>
  );
}
