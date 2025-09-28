import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 👇 Ensure Next.js recognizes your /src/app folder
  experimental: {
    appDir: true,
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "taqabackend-2xmc1.sevalla.app" },
      { protocol: "http", hostname: "192.168.1.16" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox;",
  },

  allowedDevOrigins: [
    "192.168.1.16",
    "192.168.0.16",
    "localhost",
    "127.0.0.1",
    "taqabackend-2xmc1.sevalla.app",
  ],

  eslint: {
    ignoreDuringBuilds: true,
  },

  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // 👇 Apply Webpack optimization if not using Turbopack
  ...(process.env.TURBOPACK
    ? {}
    : {
        webpack: (config, { dev, isServer }) => {
          if (!dev && !isServer) {
            config.optimization.splitChunks = {
              chunks: "all",
              cacheGroups: {
                vendor: {
                  test: /[\\/]node_modules[\\/]/,
                  name: "vendors",
                  chunks: "all",
                },
              },
            };
          }
          return config;
        },
      }),
};

export default nextConfig;
