import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Build enxuto para container: o Next emite um servidor autocontido em
  // .next/standalone, com só as dependências que a aplicação usa de fato.
  output: 'standalone',
  images: {
    // As fotos do catálogo são servidas do próprio domínio: as do seed de
    // `public/produtos/`, as enviadas pelo cadastro de `/api/arquivos/[id]`
    // (ver ADR 0007). Nenhuma das duas precisa de padrão remoto.
    //
    // `NEXT_PUBLIC_STORAGE_HOSTNAME` segue reservado para o dia em que as
    // fotos forem para um bucket.
    remotePatterns: process.env.NEXT_PUBLIC_STORAGE_HOSTNAME
      ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_STORAGE_HOSTNAME }]
      : [],
  },
  // Rotas tipadas: um href inexistente vira erro de compilação.
  typedRoutes: true,
}

export default nextConfig
