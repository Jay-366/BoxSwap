'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const routes = [
    { name: 'Home', path: '/' },
    { name: 'Swap', path: '/swap' },
    { name: 'Pool', path: '/pool' },
    { name: 'Liquidity', path: '/liquidity' },
    { name: 'Stats', path: '/stats' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-card-dark py-4 border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-solana-purple font-bold text-2xl mr-1">Sol</span>
              <span className="text-solana-green font-bold text-2xl">Swap</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-8">
              {routes.map(route => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={`${
                    isActive(route.path)
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-300 hover:text-white'
                  } py-2 text-sm font-medium`}
                >
                  {route.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="hidden md:block">
              <WalletMultiButton />
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden ml-4">
              <button
                type="button"
                className="text-gray-300 hover:text-white"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {routes.map(route => (
              <Link
                key={route.path}
                href={route.path}
                className={`${
                  isActive(route.path)
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-card hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setIsOpen(false)}
              >
                {route.name}
              </Link>
            ))}
            <div className="pt-4 pb-2">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 