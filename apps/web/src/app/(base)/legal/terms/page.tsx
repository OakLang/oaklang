"use client";

import { useMDXComponents } from "~/hooks/useMdxComponents";
import Terms from "~/markdown/terms.mdx";

export default function TermsPage() {
  const components = useMDXComponents({});
  return (
    <main className="prose dark:prose-invert mx-auto my-16">
      <Terms components={components} />
    </main>
  );
}
