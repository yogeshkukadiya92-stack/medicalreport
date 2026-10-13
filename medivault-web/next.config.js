/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/api/analyze-report': ['./node_modules/@tesseract.js-data/eng/**/*', './node_modules/tesseract.js/**/*', './node_modules/tesseract.js-core/**/*'],
  },
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
