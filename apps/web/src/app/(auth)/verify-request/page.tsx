import { notFound } from "next/navigation";
import { MailCheckIcon } from "lucide-react";

export default async function VerfiyPage(props: {
  searchParams: Promise<{ provider?: string; type?: string }>;
}) {
  const { provider, type } = await props.searchParams;

  if (type === "email" && provider === "resend") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-md flex-col items-center px-6 py-16">
          <MailCheckIcon className="h-10 w-10" />
          <h1 className="mt-8 text-center text-2xl font-semibold">
            Check your Email
          </h1>
          <p className="text-muted-foreground mt-2 w-full max-w-screen-md text-center">
            A sign in link has been sent to your email address.
          </p>
        </div>
      </div>
    );
  }

  notFound();
}
