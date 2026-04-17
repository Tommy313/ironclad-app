/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfjs-dist worker needs canvas polyfill disabled for SSR
    config.resolve.alias.canvas = false;
    return config;
  }
};

module.exports = nextConfig;
