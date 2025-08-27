/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@grofit/ui'],
  experimental: {
    externalDir: true,
  },
}
export default nextConfig
