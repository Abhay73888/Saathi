/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [], // all imagery local/data URIs for now
  },
  env: {
    NEXT_PUBLIC_API_BASE:
      process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:4000/api/v1',
  },
};

export default nextConfig;
