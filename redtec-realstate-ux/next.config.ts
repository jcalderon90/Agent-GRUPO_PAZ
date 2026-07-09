import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // necesario para Docker
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.garooinc.com' },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy al backend: mismo dominio en el browser → la cookie de sesión siempre viaja
        source: '/api/core/:path*',
        destination: `${process.env.CORE_API_URL ?? 'http://localhost:3010'}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
