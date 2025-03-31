import './globals.css'
import type { Metadata } from 'next'
import { WalletProviders } from '@/components/WalletProviders'
import { Navigation } from '@/components/Navigation'
import NovatrixBackground from '@/components/NovatrixBackground'

export const metadata: Metadata = {
  title: 'Solana Liquidity Pool',
  description: 'A decentralized liquidity pool built on Solana',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="relative min-h-screen">
          <NovatrixBackground />
          <div className="relative z-10">
            <WalletProviders>
              <div className="min-h-screen flex flex-col">
                <Navigation />
                <main className="flex-grow py-8">
                  {children}
                </main>
                <footer className="bg-card-dark py-6">
                  <div className="container mx-auto px-4 text-center text-gray-400">
                    <p>Built with ❤️ on Solana</p>
                  </div>
                </footer>
              </div>
            </WalletProviders>
          </div>
        </div>
      </body>
    </html>
  )
}
