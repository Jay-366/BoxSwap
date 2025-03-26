'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import * as idl from '../../idl/liquidity_pool.json';
import Link from 'next/link';

// Constants
const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const ENDPOINT = 'https://api.devnet.solana.com';

// Demo token data
const DEMO_TOKENS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: '11111111111111111111111111111111',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
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

// Create demo pair combinations
const DEMO_PAIRS = [
  { tokenA: DEMO_TOKENS[0], tokenB: DEMO_TOKENS[1] }, // SOL-USDC
  { tokenA: DEMO_TOKENS[0], tokenB: DEMO_TOKENS[2] }, // SOL-USDT
  { tokenA: DEMO_TOKENS[0], tokenB: DEMO_TOKENS[3] }, // SOL-BONK
  { tokenA: DEMO_TOKENS[1], tokenB: DEMO_TOKENS[2] }, // USDC-USDT
  { tokenA: DEMO_TOKENS[1], tokenB: DEMO_TOKENS[3] }, // USDC-BONK
];

interface PoolData {
  address: PublicKey;
  tokenA: typeof DEMO_TOKENS[0];
  tokenB: typeof DEMO_TOKENS[0];
  tokenAReserve: number;
  tokenBReserve: number;
  tvl: number;
  volume24h: number;
  fees24h: number;
  apy: number;
  exists: boolean;
}

export default function PoolPage() {
  const { publicKey } = useWallet();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'tvl' | 'volume' | 'apy'>('tvl');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  useEffect(() => {
    const loadPools = async () => {
      if (!connection || !program) return;
      
      setIsLoading(true);
      
      try {
        const poolsData: PoolData[] = [];
        
        // For each pair, try to load the pool
        for (const pair of DEMO_PAIRS) {
          const tokenA = pair.tokenA;
          const tokenB = pair.tokenB;
          
          try {
            const tokenAMint = new PublicKey(tokenA.mint);
            const tokenBMint = new PublicKey(tokenB.mint);
            
            // Find pool address
            const [poolAddress] = await web3.PublicKey.findProgramAddress(
              [
                Buffer.from('pool'),
                tokenAMint.toBuffer(),
                tokenBMint.toBuffer(),
              ],
              PROGRAM_ID
            );
            
            // Prepare default pool data
            const poolData: PoolData = {
              address: poolAddress,
              tokenA,
              tokenB,
              tokenAReserve: 0,
              tokenBReserve: 0,
              tvl: 0,
              volume24h: 0,
              fees24h: 0,
              apy: 0,
              exists: false
            };
            
            try {
              // Try to fetch pool account
              await program.account.pool.fetch(poolAddress);
              
              // Get pool token accounts
              const poolTokenAAccount = await getAssociatedTokenAddress(tokenAMint, poolAddress, true);
              const poolTokenBAccount = await getAssociatedTokenAddress(tokenBMint, poolAddress, true);
              
              try {
                // Get pool token balances
                const tokenAAccount = await getAccount(connection, poolTokenAAccount);
                const tokenBAccount = await getAccount(connection, poolTokenBAccount);
                
                // Calculate reserves
                const tokenAReserve = Number(tokenAAccount.amount) / Math.pow(10, tokenA.decimals);
                const tokenBReserve = Number(tokenBAccount.amount) / Math.pow(10, tokenB.decimals);
                
                // For demo purposes, generate some realistic numbers
                const solPrice = 100; // Demo SOL price in USD
                
                // Calculate TVL
                let tvlUsd;
                if (tokenA.symbol === 'SOL') {
                  tvlUsd = tokenAReserve * solPrice + tokenBReserve;
                } else if (tokenB.symbol === 'SOL') {
                  tvlUsd = tokenBReserve * solPrice + tokenAReserve;
                } else if (tokenA.symbol === 'USDC' || tokenA.symbol === 'USDT') {
                  tvlUsd = tokenAReserve * 2; // Both sides approximately equal in value
                } else if (tokenB.symbol === 'USDC' || tokenB.symbol === 'USDT') {
                  tvlUsd = tokenBReserve * 2;
                } else {
                  tvlUsd = 0;
                }
                
                // Generated data
                const volume24h = tvlUsd * (Math.random() * 0.5); // 0-50% of TVL as daily volume
                const fees24h = volume24h * 0.003; // 0.3% fee
                const apy = (fees24h * 365 * 100) / tvlUsd; // Annualized APY
                
                // Update pool data
                poolData.tokenAReserve = tokenAReserve;
                poolData.tokenBReserve = tokenBReserve;
                poolData.tvl = tvlUsd;
                poolData.volume24h = volume24h;
                poolData.fees24h = fees24h;
                poolData.apy = apy;
                poolData.exists = true;
              } catch (e) {
                console.warn(`Pool ${tokenA.symbol}-${tokenB.symbol} exists but cannot load balances`);
              }
            } catch (e) {
              // Pool doesn't exist, that's okay
              poolData.exists = false;
              
              // For demo, we'll still show it but mark as not initialized
              // In a real app, we might filter these out or show differently
              
              // Generate some fake data for demo
              const tokenAReserve = Math.random() * 1000;
              const tokenBReserve = Math.random() * 1000;
              const tvlUsd = Math.random() * 1000000;
              const volume24h = tvlUsd * (Math.random() * 0.5);
              const fees24h = volume24h * 0.003;
              const apy = (fees24h * 365 * 100) / tvlUsd;
              
              poolData.tokenAReserve = tokenAReserve;
              poolData.tokenBReserve = tokenBReserve;
              poolData.tvl = tvlUsd;
              poolData.volume24h = volume24h;
              poolData.fees24h = fees24h;
              poolData.apy = apy;
            }
            
            poolsData.push(poolData);
          } catch (e) {
            console.error(`Error loading pool for ${tokenA.symbol}-${tokenB.symbol}:`, e);
          }
        }
        
        setPools(poolsData);
      } catch (e) {
        console.error("Error loading pools:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPools();
  }, [connection, program]);

  // Filter and sort pools
  const filteredPools = pools.filter(pool => {
    if (!filter) return true;
    const searchTerm = filter.toLowerCase();
    return (
      pool.tokenA.symbol.toLowerCase().includes(searchTerm) ||
      pool.tokenB.symbol.toLowerCase().includes(searchTerm) ||
      `${pool.tokenA.symbol}-${pool.tokenB.symbol}`.toLowerCase().includes(searchTerm)
    );
  });

  const sortedPools = [...filteredPools].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'tvl':
        comparison = a.tvl - b.tvl;
        break;
      case 'volume':
        comparison = a.volume24h - b.volume24h;
        break;
      case 'apy':
        comparison = a.apy - b.apy;
        break;
    }
    
    return sortDirection === 'desc' ? -comparison : comparison;
  });

  // Formatting helpers
  const formatUSD = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  const formatNumber = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  const handleSort = (criteria: 'tvl' | 'volume' | 'apy') => {
    if (sortBy === criteria) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortDirection('desc');
    }
  };

  const handlePoolSelect = (pool: PoolData) => {
    setSelectedPool(pool);
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Liquidity Pools</h1>
        <p className="text-gray-400">Provide liquidity to earn fees and participate in the ecosystem</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pool List */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search pools..."
                  className="input w-full"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Link href="/liquidity" className="btn btn-primary">
                  Add Liquidity
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin mx-auto h-10 w-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                <p>Loading pools...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      <th className="p-4">Pool</th>
                      <th 
                        className="p-4 cursor-pointer hover:text-primary"
                        onClick={() => handleSort('tvl')}
                      >
                        <div className="flex items-center gap-1">
                          <span>TVL</span>
                          {sortBy === 'tvl' && (
                            <span>{sortDirection === 'desc' ? '↓' : '↑'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 cursor-pointer hover:text-primary"
                        onClick={() => handleSort('volume')}
                      >
                        <div className="flex items-center gap-1">
                          <span>Volume (24h)</span>
                          {sortBy === 'volume' && (
                            <span>{sortDirection === 'desc' ? '↓' : '↑'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="p-4 cursor-pointer hover:text-primary"
                        onClick={() => handleSort('apy')}
                      >
                        <div className="flex items-center gap-1">
                          <span>APY</span>
                          {sortBy === 'apy' && (
                            <span>{sortDirection === 'desc' ? '↓' : '↑'}</span>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPools.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400">
                          No pools found.
                        </td>
                      </tr>
                    ) : (
                      sortedPools.map((pool) => (
                        <tr 
                          key={pool.address.toString()} 
                          className={`border-b border-gray-800 hover:bg-card-light cursor-pointer ${
                            selectedPool?.address.toString() === pool.address.toString() ? 'bg-card-light' : ''
                          }`}
                          onClick={() => handlePoolSelect(pool)}
                        >
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="flex -space-x-2 mr-3">
                                <img 
                                  src={pool.tokenA.logoURI} 
                                  className="w-8 h-8 rounded-full border-2 border-card z-10" 
                                  alt={pool.tokenA.symbol} 
                                />
                                <img 
                                  src={pool.tokenB.logoURI} 
                                  className="w-8 h-8 rounded-full border-2 border-card" 
                                  alt={pool.tokenB.symbol} 
                                />
                              </div>
                              <div>
                                <div className="font-medium">{pool.tokenA.symbol}-{pool.tokenB.symbol}</div>
                                <div className="text-xs text-gray-400">
                                  {pool.exists ? 'Active' : 'Not Initialized'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">{formatUSD(pool.tvl)}</td>
                          <td className="p-4">{formatUSD(pool.volume24h)}</td>
                          <td className="p-4 text-secondary">{formatNumber(pool.apy)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pool Details */}
        <div className="lg:col-span-1">
          {selectedPool ? (
            <div className="card">
              <div className="flex items-center mb-4">
                <div className="flex -space-x-2 mr-3">
                  <img 
                    src={selectedPool.tokenA.logoURI} 
                    className="w-10 h-10 rounded-full border-2 border-card z-10" 
                    alt={selectedPool.tokenA.symbol} 
                  />
                  <img 
                    src={selectedPool.tokenB.logoURI} 
                    className="w-10 h-10 rounded-full border-2 border-card" 
                    alt={selectedPool.tokenB.symbol} 
                  />
                </div>
                <h2 className="text-2xl font-bold">{selectedPool.tokenA.symbol}-{selectedPool.tokenB.symbol}</h2>
              </div>

              <div className="mb-6">
                <div className="text-gray-400 mb-1">Pool Address</div>
                <div className="font-mono text-sm bg-card-dark p-2 rounded overflow-auto">
                  {selectedPool.address.toString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-gray-400 mb-1">TVL</div>
                  <div className="text-xl font-semibold">{formatUSD(selectedPool.tvl)}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Volume (24h)</div>
                  <div className="text-xl font-semibold">{formatUSD(selectedPool.volume24h)}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Fees (24h)</div>
                  <div className="text-xl font-semibold">{formatUSD(selectedPool.fees24h)}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">APY</div>
                  <div className="text-xl font-semibold text-secondary">{formatNumber(selectedPool.apy)}%</div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-gray-400 mb-2">Reserves</div>
                <div className="bg-card-dark p-3 rounded mb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <img src={selectedPool.tokenA.logoURI} className="w-6 h-6 mr-2" alt={selectedPool.tokenA.symbol} />
                      <span>{selectedPool.tokenA.symbol}</span>
                    </div>
                    <div>{formatNumber(selectedPool.tokenAReserve, selectedPool.tokenA.decimals)}</div>
                  </div>
                </div>
                <div className="bg-card-dark p-3 rounded">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <img src={selectedPool.tokenB.logoURI} className="w-6 h-6 mr-2" alt={selectedPool.tokenB.symbol} />
                      <span>{selectedPool.tokenB.symbol}</span>
                    </div>
                    <div>{formatNumber(selectedPool.tokenBReserve, selectedPool.tokenB.decimals)}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link 
                  href={`/swap?from=${selectedPool.tokenA.mint}&to=${selectedPool.tokenB.mint}`}
                  className="btn btn-primary text-center"
                >
                  Swap
                </Link>
                <Link 
                  href={`/liquidity?from=${selectedPool.tokenA.mint}&to=${selectedPool.tokenB.mint}`}
                  className="btn btn-outline text-center"
                >
                  Add Liquidity
                </Link>
              </div>
            </div>
          ) : (
            <div className="card text-center p-8">
              <div className="text-6xl mb-4">👈</div>
              <h3 className="text-xl font-semibold mb-2">Select a Pool</h3>
              <p className="text-gray-400">
                Choose a pool from the list to view detailed information and interact with it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 