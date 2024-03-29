import { FeaturesGrid } from './_components/features-grid';
import { UsernameForm } from './_components/username-form';
import { RedirectType, redirect } from 'next/navigation';
import Footer from 'src/app/(base)/_components/footer';
import NavBar from 'src/app/(base)/_components/nav-bar';
import { getSessionId } from '~/utils/server-auth';

export default async function LandingPage() {
  const sessionId = await getSessionId();
  if (sessionId) {
    redirect('/home', RedirectType.replace);
  }
  return (
    <div className="polka flex min-h-screen flex-col">
      <NavBar />
      <main>
        <section className="container my-32 max-w-screen-md px-4 md:px-8" id="hero">
          <h1 className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-center text-4xl font-bold text-transparent md:text-6xl">
            The social network for techies
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-center font-medium text-muted-foreground md:text-lg">
            Connect, learn, and innovate together.
          </p>
          <UsernameForm />
        </section>
        <section className="my-32">
          <div className="container max-w-screen-xl px-4 md:px-8">
            <FeaturesGrid />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
