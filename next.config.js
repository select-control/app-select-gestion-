/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Permite subir documentos/imágenes de contratos (por defecto Next limita a 1 MB).
    serverActions: { bodySizeLimit: "15mb" },
  },
};

module.exports = nextConfig;
