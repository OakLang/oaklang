/** @type {import("next").NextConfig} */
const config = {
  // experimental: {
  //   swcPlugins: [
  //     [
  //       'next-superjson-plugin',
  //       {
  //         excluded: [],
  //       },
  //     ],
  //   ],
  // },

  /**
   * If you have `experimental: { appDir: true }` set, then you must comment the below `i18n` config
   * out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  images: {
    remotePatterns: [],
  },

  reactStrictMode: true,
};

export default config;
