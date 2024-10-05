"use client";

import { useMDXComponents } from "~/hooks/useMdxComponents";
import Privacy from "~/markdown/privacy.mdx";

export default function PrivacyPage() {
  const components = useMDXComponents({});
  return (
    <main className="prose dark:prose-invert mx-auto my-16">
      <Privacy components={components} />
    </main>
  );
}
