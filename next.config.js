/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  productionBrowserSourceMaps: true,
  reactStrictMode: false,
};

module.exports = nextConfig;
