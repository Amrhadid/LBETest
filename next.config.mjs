/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the page edge/Workers-friendly: avoid Node-only APIs so the site
  // can be deployed to Cloudflare (see README for the OpenNext adapter).
  images: {
    // No remote images are used on the marketing homepage yet; logos are
    // inline SVG. When real assets are added, configure remotePatterns here.
    unoptimized: true,
  },
};

export default nextConfig;
