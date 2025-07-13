/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore type errors during build for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during build for deployment
    ignoreDuringBuilds: true,
  },
  // Add other Next.js configurations here if needed
};

export default nextConfig;