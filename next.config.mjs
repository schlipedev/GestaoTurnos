/** @type {import('next').NextConfig} */
const repoName = 'GestaoTurnos'
const basePath = `/${repoName}`
const assetPrefix = `${basePath}/`

const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix,
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
