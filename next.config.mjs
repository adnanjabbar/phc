/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "138.197.39.100"],
  },
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
