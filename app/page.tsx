'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-solana-purple to-solana-green inline-block text-transparent bg-clip-text">
          Solana Liquidity Pool
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Trade, provide liquidity, and earn rewards on the fastest, most efficient decentralized exchange built on Solana.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/swap" className="btn btn-primary text-lg px-8 py-3">
            Start Trading
          </Link>
          <Link href="/pool" className="btn btn-outline text-lg px-8 py-3">
            View Pools
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our DEX?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card">
            <div className="mb-4 text-solana-green">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-gray-400">
              Experience sub-second transactions and confirmations with Solana's 
              high-performance blockchain.
            </p>
          </div>
          
          <div className="card">
            <div className="mb-4 text-solana-blue">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Low Fees</h3>
            <p className="text-gray-400">
              Save on gas fees with transactions costing less than $0.01, 
              making even small trades economical.
            </p>
          </div>
          
          <div className="card">
            <div className="mb-4 text-solana-magenta">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">High Security</h3>
            <p className="text-gray-400">
              Built with robust security measures and audited smart contracts to 
              ensure your assets are protected.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card rounded-2xl p-8 my-10">
        <h2 className="text-3xl font-bold text-center mb-12">Platform Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-4xl font-bold text-solana-purple mb-2">$24M+</p>
            <p className="text-gray-400">Total Value Locked</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-solana-green mb-2">150K+</p>
            <p className="text-gray-400">Transactions</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-solana-blue mb-2">42+</p>
            <p className="text-gray-400">Token Pairs</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-solana-magenta mb-2">18K+</p>
            <p className="text-gray-400">Users</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Start?</h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Connect your wallet and begin trading or providing liquidity in just a few clicks.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {publicKey ? (
            <Link href="/swap" className="btn btn-primary text-lg px-8 py-3">
              Go to Exchange
            </Link>
          ) : (
            <button 
              className="btn btn-primary text-lg px-8 py-3" 
              onClick={() => (document.querySelector('.wallet-adapter-button') as HTMLElement)?.click()}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </section>
    </div>
  );
} 