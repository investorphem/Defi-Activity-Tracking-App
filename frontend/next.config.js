/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Power up your images: Allow protocol icons from Hiro or other CDNs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'explorer.hiro.so',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'api.hirosystems.com',
      },
    ],
    // Helps with performance on high-density DeFi dashboards
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  // Compiler optimizations for a snappier "Production" feel
  compiler: {
    // Automatically removes console.logs in production to keep the console clean
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Redirects or Rewrites can be added here if you want 
  // to mask your API URL for better security/cleaner URLs
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
