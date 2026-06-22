/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Railway dynamic port support
  serverRuntimeConfig: {
    port: process.env.PORT || 3000,
  },
};

module.exports = nextConfig;
