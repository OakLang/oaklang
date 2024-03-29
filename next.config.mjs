/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import('./src/env.mjs');

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    swcPlugins: [
      [
        'next-superjson-plugin',
        {
          excluded: [],
        },
      ],
    ],
  },

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
    remotePatterns: [
      { hostname: '**.githubusercontent.com', protocol: 'https' },
      { hostname: '**.gravatar.com', protocol: 'https' },
      { hostname: '**.stackexchange.com', protocol: 'https' },
      { hostname: '**.stack.imgur.com', protocol: 'https' },
      { hostname: 'cdn.sstatic.net', protocol: 'https' },
      { hostname: '**.twimg.com', protocol: 'https' },
      { hostname: 'wakatime.com', protocol: 'https' },
      { hostname: 'static-cdn.jtvnw.net', protocol: 'https' },
      { hostname: '**.licdn.com', protocol: 'https' },
      { hostname: '**.imgix.net', protocol: 'https' },
      { hostname: '**.ytimg.com', protocol: 'https' },
      { hostname: 'images.unsplash.com', protocol: 'https' },
      { hostname: '**.cdninstagram.com', protocol: 'https' },
      { hostname: '**.tiktokcdn-us.com', protocol: 'https' },
      { hostname: '**.ggpht.com', protocol: 'https' },
      { hostname: '**.googleusercontent.com', protocol: 'https' },
      { hostname: '**.redditmedia.com', protocol: 'https' },
      { hostname: '**.redditstatic.com', protocol: 'https' },
    ],
  },

  reactStrictMode: true,
};

export default config;
