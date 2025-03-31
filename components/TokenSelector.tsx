'use client';

import { useState } from 'react';

interface TokenSelectorProps {
  selectedToken: {
    symbol: string;
    mint: string;
    balance: number;
    decimals: number;
  };
  onSelectToken: (token: {
    symbol: string;
    mint: string;
    balance: number;
    decimals: number;
  }) => void;
}

// For demo purposes - in a real app these would come from an API
const DEMO_TOKENS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: '11111111111111111111111111111111',
    decimals: 9,
    balance: 0,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    balance: 0,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    balance: 0,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    balance: 0,
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  }
];

export function TokenSelector({ selectedToken, onSelectToken }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelectToken = (token: typeof DEMO_TOKENS[0]) => {
    onSelectToken({
      symbol: token.symbol,
      mint: token.mint,
      balance: token.balance,
      decimals: token.decimals
    });
    setIsOpen(false);
  };
  
  // Find the current token in our demo list (for the logo)
  const currentToken = DEMO_TOKENS.find(t => t.symbol === selectedToken.symbol) || DEMO_TOKENS[0];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700 hover:border-gray-500"
      >
        {currentToken.logoURI && (
          <img 
            src={currentToken.logoURI} 
            alt={currentToken.symbol}
            className="w-6 h-6 rounded-full"
          />
        )}
        <span className="font-medium">{selectedToken.symbol}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
          <div className="p-3 border-b border-gray-700">
            <h3 className="font-semibold">Select a token</h3>
          </div>
          <div className="max-h-64 overflow-y-auto z-50 relative bg-white">
            {DEMO_TOKENS.map(token => (
              <button
                key={token.mint}
                className="w-full flex items-center p-3 hover:bg-gray-200 transition-colors"
                onClick={() => handleSelectToken(token)}
              >
                {token.logoURI && (
                  <img 
                    src={token.logoURI} 
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                )}
                <div className="text-left">
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-sm text-gray-400">{token.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 