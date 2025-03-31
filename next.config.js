/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'raw.githubusercontent.com',
      'assets.coingecko.com',
      'token.jup.ag',
      's2.coinmarketcap.com',
      'cryptologos.cc',
      'solana.com',
      'solscan.io',
      'arweave.net',
      'ipfs.io',
      'cloudflare-ipfs.com',
    ],
  },
}

module.exports = nextConfig 