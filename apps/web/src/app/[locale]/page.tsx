import { auth } from "@acme/auth";

import HomePage from "./home-page";

export default async function Home() {
  const session = await auth();

  return <HomePage session={session} />;
}
