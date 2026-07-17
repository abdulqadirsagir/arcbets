/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };

    // Ignore optional @x402 dependencies (not needed for MetaMask/injected connector)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@x402/core': false,
      '@x402/evm': false,
      '@x402/evm/exact/client': false,
      '@x402/evm/upto/client': false,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
    };

    return config;
  },
}

module.exports = nextConfig
