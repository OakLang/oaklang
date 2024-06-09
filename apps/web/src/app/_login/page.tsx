import OAuthProviders from './OAuthProviders';

export default function LogInPage() {
  return (
    <div className="container my-16 max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Log In</h1>
      </div>
      <OAuthProviders />
    </div>
  );
}
