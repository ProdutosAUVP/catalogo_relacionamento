import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Build enxuto para container: o Next emite um servidor autocontido em
  // .next/standalone, com só as dependências que a aplicação usa de fato.
  output: 'standalone',
  images: {
    // Fotos de produto vivem em bucket S3-compatível. O host entra por env
    // para que dev, staging e produção não exijam mudança de código.
    remotePatterns: process.env.NEXT_PUBLIC_STORAGE_HOSTNAME
      ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_STORAGE_HOSTNAME }]
      : [],
  },
  // Rotas tipadas: um href inexistente vira erro de compilação.
  typedRoutes: true,
}

export default nextConfig
