import type { ReactNode } from "react";

export default function FullScreenMessage({
  children,
  description,
  title,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mx-auto my-16 w-full max-w-screen-md space-y-4 px-8">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="flex gap-2">{children}</div>
      </div>
    </div>
  );
}
