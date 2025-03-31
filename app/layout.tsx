import './globals.css'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Navigation } from '@/components/Navigation'



import NovatrixBackground from '@/components/NovatrixBackground'

import ClientProvider from './ClientProvider'

// Import WalletProviders with no SSR
const WalletProvidersNoSSR = dynamic(
  () => import('../components/WalletProviders'),
  { ssr: false }
);

// Import Navigation with dynamic to avoid hydration issues
const NavigationDynamic = dynamic(() => import('@/components/Navigation'), {
  ssr: false
});

export const metadata: Metadata = {
  title: 'Solana Swap App',
  description: 'Simple Solana token swap application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProvider>
          <div className="relative min-h-screen">
          <NovatrixBackground />

            <div className="relative z-10">
              <WalletProvidersNoSSR>
                <div className="min-h-screen flex flex-col">
                <NavigationDynamic />

                  <main className="flex-grow py-8">
                    {children}
                  </main>
                  <footer className="bg-card-dark py-6">
                    <div className="container mx-auto px-4 text-center text-gray-400">
                      <p>Built with ❤️ on Solana</p>
                    </div>
                  </footer>
                </div>
              </WalletProvidersNoSSR>
            </div>
          </div>
        </ClientProvider>
      </body>
    </html>
  )
}
