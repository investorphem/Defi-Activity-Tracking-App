/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'explorer.hiro.so',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'api.hirosystems.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  async rewrites() 
    // 🛡️ Safety Check: If the URL is missing, skip the rewrite to prevent build crash
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    if (!apiUrl) {
      console.warn("⚠️ NEXT_PUBLIC_API_URL is not defined. API rewrites will be disabled.");
      return [];
    }

    return [
      {
        source: '/api/v1/:path*',
        // Ensure we don't end up with double slashes if apiUrl has one
        destination: `${apiUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
