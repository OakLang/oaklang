import { fileURLToPath } from "url";
import createMDX from "@next/mdx";
import createJiti from "jiti";
import createNextIntlPlugin from "next-intl/plugin";

const withMdx = createMDX({});

const withNextIntl = createNextIntlPlugin();

createJiti(fileURLToPath(import.meta.url))("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactStrictMode: true,
  transpilePackages: ["@acme/api", "@acme/auth", "@acme/db", "@acme/core"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default withMdx(withNextIntl(config));
