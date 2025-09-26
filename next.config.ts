import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.0.16',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.16',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Fix CORS warning for development
  allowedDevOrigins: [
    '192.168.1.16',
    '192.168.0.16',
    'localhost',
    '127.0.0.1',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Webpack configuration - only apply when not using Turbopack
  ...(process.env.TURBOPACK ? {} : {
    webpack: (config, { dev, isServer }) => {
      if (!dev && !isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        };
      }
      return config;
    },
  }),
};

export default nextConfig;
