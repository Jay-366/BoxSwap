'use client';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css');

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set up Solana network and wallet
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  // Get current path for active link highlighting
  const pathname = usePathname();

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {/* Navigation */}
          <nav className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <Link href="/" className="text-xl font-bold text-black">
                    Solana DEX
                  </Link>
                </div>
                <div className="flex items-center space-x-4">
                  <Link
                    href="/"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/'
                        ? 'bg-gray-100 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    Home
                  </Link>
                  <Link
                    href="/swap"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/swap'
                        ? 'bg-gray-100 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    Swap
                  </Link>
                  <Link
                    href="/pool"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/pool'
                        ? 'bg-gray-100 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    Pool
                  </Link>
                  <Link
                    href="/stake"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/stake'
                        ? 'bg-gray-100 text-black'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    Stake
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 bg-white">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="text-center text-gray-600 text-sm">
                <p>© 2024 Solana DEX. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 