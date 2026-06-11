/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pacotes do monorepo transpilados pelo Next.
  transpilePackages: ["@legaltech/core", "@legaltech/db"],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // @legaltech/core é TS puro (type: module) com imports estilo NodeNext (".js").
  // Como o Next consome o source via transpilePackages, o webpack precisa
  // resolver esses ".js" para os arquivos ".ts" reais.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
