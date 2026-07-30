/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite corpuri de request mai mari pentru încărcarea fișierelor XML din admin.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

module.exports = nextConfig;
