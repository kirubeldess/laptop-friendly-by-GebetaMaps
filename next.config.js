/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['example.com', 'via.placeholder.com', 'uploadthing.com', 'utfs.io'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig; 