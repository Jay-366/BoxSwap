'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import Navigation from '@/components/Navigation';

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <div>
      
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="py-20 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-solana-purple to-solana-green inline-block text-transparent bg-clip-text">
            BoxSwap is Ready
          </h1>
          <p className="text-xl text-black mb-10 max-w-2xl mx-auto">
            Trade, provide liquidity, and earn rewards on the fastest, most efficient decentralized exchange built on Solana.
          </p>
          <div className="flex flex-wrap text-black justify-center gap-4">
            <Link href="/swap" className="btn btn-primary text-lg px-8 py-3">
              Start BoxSwapping
            </Link>
            
          </div>
        </section>

       

        
      </div>
    </div>
  );
} 