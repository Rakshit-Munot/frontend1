/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/:filename',
        destination: '/api/file?filename=:filename',
      },
    ];
  },
};

module.exports = nextConfig;
