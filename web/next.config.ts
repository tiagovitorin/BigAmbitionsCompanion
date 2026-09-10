import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.110',
    'localhost',
    '127.0.0.1',
  ],
  webpack: (config) => {
    const localesIgnore = /[\\/]src[\\/]locales[\\/](?!en\.json)[^\\/]+\.json$/;
    const existing = config.watchOptions?.ignored;
    let ignored: unknown;
    if (existing instanceof RegExp) {
      ignored = new RegExp(
        `${existing.source}|${localesIgnore.source}`
      );
    } else if (Array.isArray(existing)) {
      ignored = [...existing, '**/src/locales/*.json'];
    } else if (typeof existing === 'string' && existing.length > 0) {
      ignored = [existing, '**/src/locales/*.json'];
    } else {
      ignored = localesIgnore;
    }
    config.watchOptions = { ...config.watchOptions, ignored };
    return config;
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
