import { fileURLToPath } from "url";
import { NextConfig } from "next";
import createMDX from "@next/mdx";
import createJiti from "jiti";
import createNextIntlPlugin from "next-intl/plugin";

const withMdx = createMDX({});

const withNextIntl = createNextIntlPlugin();

createJiti(fileURLToPath(import.meta.url))("./src/env");

const config: NextConfig = {
  output: "standalone",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactStrictMode: true,
  transpilePackages: [
    "@acme/api",
    "@acme/auth",
    "@acme/db",
    "@acme/core",
    "@acme/wakaq",
    "@acme/email",
  ],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default withMdx(withNextIntl(config));
