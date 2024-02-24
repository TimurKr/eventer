/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
