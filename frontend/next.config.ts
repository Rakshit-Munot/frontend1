/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/:filename',
        destination: '/api/file/:filename',
      },
    ];
  },
};

module.exports = nextConfig;
