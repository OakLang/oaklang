import LogInForm from './_components/login-form';

export default function LogInPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="container max-w-sm">
        <LogInForm next={searchParams.next} />
      </div>
    </div>
  );
}
