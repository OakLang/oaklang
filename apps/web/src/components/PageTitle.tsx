import React from "react";

export default function PageTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col space-y-1.5">
      <h1 className="text-2xl font-semibold leading-none tracking-tight">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
