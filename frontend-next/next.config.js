/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        source: '/workspace-preview/:path*',
        destination: 'http://127.0.0.1:8000/workspace-preview/:path*',
      },
      {
        source: '/proxy/:port/:path*',
        destination: 'http://127.0.0.1:8000/proxy/:port/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
