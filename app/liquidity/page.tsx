'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import * as idl from '../../idl/liquidity_pool.json';

// Constants
const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const ENDPOINT = 'https://api.devnet.solana.com';

// Demo token data (same as in pool/page.tsx)
const DEMO_TOKENS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111112/logo.png',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  }
];

// Fee tier options based on Raydium's docs
const FEE_TIERS = [
  { value: 0.01, label: '0.01%', description: 'Best for very stable assets' },
  { value: 0.05, label: '0.05%', description: 'Best for pegged-assets and high volume pairs' },
  { value: 0.25, label: '0.25%', description: 'Best for most pairs' },
  { value: 1.00, label: '1.00%', description: 'Best for exotic pairs' },
];

export default function LiquidityPage() {
  const { publicKey, signTransaction } = useWallet();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'manage'>('add');
  const [showPoolCreation, setShowPoolCreation] = useState(false);
  
  // Token selection
  const [tokenA, setTokenA] = useState(DEMO_TOKENS[0]); // SOL
  const [tokenB, setTokenB] = useState(DEMO_TOKENS[1]); // USDC
  
  // Pool creation state
  const [feeTier, setFeeTier] = useState(FEE_TIERS[2]); // Default 0.25%
  const [startingPrice, setStartingPrice] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [isFullRange, setIsFullRange] = useState(false);
  const [depositAmounts, setDepositAmounts] = useState<{ tokenA: string; tokenB: string }>({ tokenA: '', tokenB: '' });
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'none' }>({ text: '', type: 'none' });

  useEffect(() => {
    // Initialize connection
    const conn = new Connection(ENDPOINT);
    setConnection(conn);
    
    try {
      // Try to initialize program even without wallet connection (for read-only operations)
      // Create a mock wallet for read-only operations
      const mockWallet = {
        publicKey: null,
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any) => txs,
      };
      
      const anchorProvider = new AnchorProvider(
        conn,
        mockWallet as any,
        { commitment: 'processed' }
      );
      const anchorProgram = new Program(idl as any, PROGRAM_ID, anchorProvider);
      setProgram(anchorProgram);
    } catch (e) {
      console.error("Error initializing program:", e);
    }
  }, []);
  
  // Effect to update price range when starting price changes
  useEffect(() => {
    if (startingPrice && !isNaN(parseFloat(startingPrice))) {
      const price = parseFloat(startingPrice);
      setPriceRange({
        min: (price * 0.5).toFixed(6), // 50% below
        max: (price * 1.5).toFixed(6), // 50% above
      });
    }
  }, [startingPrice]);
  
  // Handle switching tokens
  const switchTokens = () => {
    setTokenA(tokenB);
    setTokenB(tokenA);
  };

  // Function to handle creating a new pool
  const handleCreatePool = async () => {
    if (!publicKey || !connection || !program) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      setMessage({ text: 'Creating pool...', type: 'info' });
      // Implementation would connect to Raydium's CLMM SDK here
      
      // For demo purposes, just show success after delay
      setTimeout(() => {
        setMessage({ text: 'Pool created successfully! You can now add liquidity.', type: 'success' });
        setIsLoading(false);
        setShowPoolCreation(false);
      }, 2000);
    } catch (error: any) {
      setMessage({ text: `Error creating pool: ${error.message}`, type: 'error' });
      setIsLoading(false);
    }
  };

  // Function to handle adding liquidity
  const handleAddLiquidity = async () => {
    if (!publicKey || !connection || !program) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      setMessage({ text: 'Adding liquidity...', type: 'info' });
      // Implementation would connect to Raydium's CLMM SDK here
      
      // For demo purposes, just show success after delay
      setTimeout(() => {
        setMessage({ text: 'Liquidity added successfully!', type: 'success' });
        setIsLoading(false);
      }, 2000);
    } catch (error: any) {
      setMessage({ text: `Error adding liquidity: ${error.message}`, type: 'error' });
      setIsLoading(false);
    }
  };

  // Function to handle removing liquidity
  const handleRemoveLiquidity = async () => {
    if (!publicKey || !connection || !program) {
      setMessage({ text: 'Please connect your wallet first', type: 'error' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      setMessage({ text: 'Removing liquidity...', type: 'info' });
      // Implementation would connect to Raydium's CLMM SDK here
      
      // For demo purposes, just show success after delay
      setTimeout(() => {
        setMessage({ text: 'Liquidity removed successfully!', type: 'success' });
        setIsLoading(false);
      }, 2000);
    } catch (error: any) {
      setMessage({ text: `Error removing liquidity: ${error.message}`, type: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Liquidity Pools</h1>
      
      {/* Tab Navigation */}
      <div className="flex mb-6 border-b">
        <button 
          className={`py-2 px-4 ${activeTab === 'add' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('add')}
        >
          Add Liquidity
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'remove' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('remove')}
        >
          Remove Liquidity
        </button>
        <button 
          className={`py-2 px-4 ${activeTab === 'manage' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage Positions
        </button>
      </div>
      
      {/* Messages */}
      {message.type !== 'none' && (
        <div className={`p-4 mb-4 rounded ${
          message.type === 'success' ? 'bg-green-100 text-green-800' :
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {message.text}
        </div>
      )}
      
      {/* Add Liquidity Tab */}
      {activeTab === 'add' && (
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Liquidity</h2>
              <button 
                onClick={() => setShowPoolCreation(!showPoolCreation)}
                className="text-blue-500 hover:text-blue-700"
              >
                {showPoolCreation ? 'Cancel' : '+ Create New Pool'}
              </button>
            </div>
            
            {showPoolCreation ? (
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Create a Concentrated Liquidity Pool</h3>
                
                {/* Step 1: Select tokens & fee tier */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">1. Select tokens & fee tier</h4>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5/12">
                      <label className="block text-sm mb-1">Base Token</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={tokenA.symbol}
                        onChange={(e) => setTokenA(DEMO_TOKENS.find(t => t.symbol === e.target.value) || DEMO_TOKENS[0])}
                      >
                        {DEMO_TOKENS.map(token => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      className="p-2 border rounded"
                      onClick={switchTokens}
                    >
                      ⇄
                    </button>
                    
                    <div className="w-5/12">
                      <label className="block text-sm mb-1">Quote Token</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={tokenB.symbol}
                        onChange={(e) => setTokenB(DEMO_TOKENS.find(t => t.symbol === e.target.value) || DEMO_TOKENS[1])}
                      >
                        {DEMO_TOKENS.map(token => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1">Fee Tier</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {FEE_TIERS.map(tier => (
                        <button
                          key={tier.label}
                          className={`p-2 border rounded ${feeTier.value === tier.value ? 'bg-blue-50 border-blue-500' : ''}`}
                          onClick={() => setFeeTier(tier)}
                        >
                          <div className="font-medium">{tier.label}</div>
                          <div className="text-xs text-gray-500">{tier.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Step 2: Set Starting Price & Range */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">2. Set Starting Price & Range</h4>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">
                      Starting Price (${tokenB.symbol} per ${tokenA.symbol})
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm">Price Range</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="fullRange"
                          checked={isFullRange}
                          onChange={(e) => setIsFullRange(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="fullRange" className="text-sm">Full Range</label>
                      </div>
                    </div>
                    
                    {!isFullRange ? (
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="block text-xs text-gray-500">Min Price</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded"
                            placeholder="0.00"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs text-gray-500">Max Price</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded"
                            placeholder="0.00"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-2">
                        Your liquidity will be allocated across the full price range.
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Step 3: Deposit Amount */}
                <div className="mb-6">
                  <h4 className="font-medium mb-2">3. Deposit Amount</h4>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">{tokenA.symbol} Amount</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        placeholder="0.00"
                        value={depositAmounts.tokenA}
                        onChange={(e) => setDepositAmounts({...depositAmounts, tokenA: e.target.value})}
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">{tokenB.symbol} Amount</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        placeholder="0.00"
                        value={depositAmounts.tokenB}
                        onChange={(e) => setDepositAmounts({...depositAmounts, tokenB: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <button
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  onClick={handleCreatePool}
                  disabled={isLoading || !startingPrice || (!depositAmounts.tokenA && !depositAmounts.tokenB)}
                >
                  {isLoading ? 'Creating...' : 'Create Pool & Add Liquidity'}
                </button>
              </div>
            ) : (
              <div>
                {/* Add Liquidity Form */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5/12">
                      <label className="block text-sm mb-1">Token 1</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={tokenA.symbol}
                        onChange={(e) => setTokenA(DEMO_TOKENS.find(t => t.symbol === e.target.value) || DEMO_TOKENS[0])}
                      >
                        {DEMO_TOKENS.map(token => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      className="p-2 border rounded"
                      onClick={switchTokens}
                    >
                      ⇄
                    </button>
                    
                    <div className="w-5/12">
                      <label className="block text-sm mb-1">Token 2</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={tokenB.symbol}
                        onChange={(e) => setTokenB(DEMO_TOKENS.find(t => t.symbol === e.target.value) || DEMO_TOKENS[1])}
                      >
                        {DEMO_TOKENS.map(token => (
                          <option key={token.symbol} value={token.symbol}>
                            {token.symbol} - {token.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Fee Tier</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {FEE_TIERS.map(tier => (
                        <button
                          key={tier.label}
                          className={`p-2 border rounded ${feeTier.value === tier.value ? 'bg-blue-50 border-blue-500' : ''}`}
                          onClick={() => setFeeTier(tier)}
                        >
                          <div className="font-medium">{tier.label}</div>
                          <div className="text-xs text-gray-500">{tier.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm">Price Range</label>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="fullRange"
                          checked={isFullRange}
                          onChange={(e) => setIsFullRange(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="fullRange" className="text-sm">Full Range</label>
                      </div>
                    </div>
                    
                    {!isFullRange ? (
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="block text-xs text-gray-500">Min Price</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded"
                            placeholder="0.00"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs text-gray-500">Max Price</label>
                          <input
                            type="number"
                            className="w-full p-2 border rounded"
                            placeholder="0.00"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-2">
                        Your liquidity will be allocated across the full price range.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4 mb-4">
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">{tokenA.symbol} Amount</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        placeholder="0.00"
                        value={depositAmounts.tokenA}
                        onChange={(e) => setDepositAmounts({...depositAmounts, tokenA: e.target.value})}
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm mb-1">{tokenB.symbol} Amount</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        placeholder="0.00"
                        value={depositAmounts.tokenB}
                        onChange={(e) => setDepositAmounts({...depositAmounts, tokenB: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <button
                    className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    onClick={handleAddLiquidity}
                    disabled={isLoading || (!depositAmounts.tokenA && !depositAmounts.tokenB)}
                  >
                    {isLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Remove Liquidity Tab */}
      {activeTab === 'remove' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Remove Liquidity</h2>
          
          <div className="text-center py-16">
            <p className="text-gray-500">You have no active positions to remove liquidity from.</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setActiveTab('add')}
            >
              Add Liquidity First
            </button>
          </div>
        </div>
      )}
      
      {/* Manage Positions Tab */}
      {activeTab === 'manage' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Liquidity Positions</h2>
          
          <div className="text-center py-16">
            <p className="text-gray-500">You have no active liquidity positions.</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setActiveTab('add')}
            >
              Add Liquidity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
