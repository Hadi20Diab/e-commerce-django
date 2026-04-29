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
    ],
  },
};

module.exports = nextConfig;
