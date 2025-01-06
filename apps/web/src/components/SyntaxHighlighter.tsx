"use client";

import { Prism as ReactSyntaxHighlighter } from "react-syntax-highlighter";
import docco from "react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus";

export default function SyntaxHighlighter({
  children,
  language,
}: {
  children: string;
  language: string;
}) {
  return (
    <ReactSyntaxHighlighter
      language={language}
      style={docco}
      customStyle={{
        borderRadius: 12,
      }}
      showLineNumbers
    >
      {children}
    </ReactSyntaxHighlighter>
  );
}
