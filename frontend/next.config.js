/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      // Railway production backend (wildcard covers any subdomain)
      {
        protocol: 'https',
        hostname: '*.railway.app',
        pathname: '/media/**',
      },
      // Also allow the direct railway.app domain without subdomain
      {
        protocol: 'https',
        hostname: 'railway.app',
        pathname: '/media/**',
      },
      // Render production backend
      {
        protocol: 'https',
        hostname: '*.onrender.com',
        pathname: '/media/**',
      },
      // Picsum Photos CDN (product images served from here)
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'fastly.picsum.photos',
      },
    ],
  },
};

module.exports = nextConfig;
