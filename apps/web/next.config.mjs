/** @type {import('next').NextConfig} */
const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1';

if (process.env.VERCEL && !process.env.NEXT_PUBLIC_API_BASE) {
  // NEXT_PUBLIC_* is inlined at build time, so a missing value is baked into the
  // deployed bundle and every API call fails. See docs/VERCEL_DEPLOY.md.
  console.warn(
    '\n[saath] NEXT_PUBLIC_API_BASE is not set for this Vercel deployment —\n' +
      `         the build will call ${apiBase} from the browser.\n` +
      '         Set it to your API URL (e.g. https://api.example.com/api/v1) in\n' +
      '         Vercel → Project → Settings → Environment Variables, then redeploy.\n',
  );
}

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@saath/shared'],
  images: {
    remotePatterns: [], // all imagery local/data URIs for now
  },
  env: {
    NEXT_PUBLIC_API_BASE: apiBase,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
