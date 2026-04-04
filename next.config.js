/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  reactStrictMode: false,
  swcMinify: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

module.exports = nextConfig;
