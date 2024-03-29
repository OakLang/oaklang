import { RedirectType, redirect } from 'next/navigation';
import { stepNumberToPath } from '~/stores/onboarding-store';
import { getUser } from '~/utils/server-auth';

export default async function Onboard() {
  const user = await getUser();
  if (!user) {
    redirect('/flow/login', RedirectType.replace);
  }
  const path = stepNumberToPath.get(user.username ? 1 : 0);
  if (path) {
    redirect(path, RedirectType.replace);
  }
  redirect('/home', RedirectType.replace);
}
