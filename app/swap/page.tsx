'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { 
  getAssociatedTokenAddress, 
  getAccount, 
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import * as idl from '../../idl/liquidity_pool.json';
import { TokenSelector } from '@/components/TokenSelector';
import { PriceInfo } from '@/components/PriceInfo';
import { SwapSettings } from '@/components/SwapSettings';

// Constants
const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const ENDPOINT = 'https://api.devnet.solana.com';

export default function SwapPage() {
  const { publicKey, signTransaction } = useWallet();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  
  // Token information
  const [tokenA, setTokenA] = useState<{
    symbol: string;
    mint: string;
    balance: number;
    decimals: number;
  }>({
    symbol: 'SOL',
    mint: '',
    balance: 0,
    decimals: 9
  });
  
  const [tokenB, setTokenB] = useState<{
    symbol: string;
    mint: string;
    balance: number;
    decimals: number;
  }>({
    symbol: 'USDC',
    mint: '',
    balance: 0,
    decimals: 6
  });
  
  // Pool information
  const [poolKey, setPoolKey] = useState<PublicKey | null>(null);
  const [poolInfo, setPoolInfo] = useState<{
    tokenAReserve: number;
    tokenBReserve: number;
    price: number;
  } | null>(null);
  
  // Swap inputs
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [swapDirection, setSwapDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
  const [outputAmount, setOutputAmount] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [isPriceImpactHigh, setIsPriceImpactHigh] = useState<boolean>(false);
  
  // Status
  const [status, setStatus] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'loading' | 'none';
  }>({
    message: '',
    type: 'none'
  });
  
  useEffect(() => {
    // Initialize connection
    const conn = new Connection(ENDPOINT);
    setConnection(conn);
    
    if (publicKey && signTransaction) {
      const anchorProvider = new AnchorProvider(
        conn,
        {
          publicKey,
          signTransaction,
          signAllTransactions: async (txs: Transaction[]) => {
            const signedTxs = [];
            for (const tx of txs) {
              signedTxs.push(await signTransaction(tx));
            }
            return signedTxs;
          },
        },
        { commitment: 'processed' }
      );
      
      setProvider(anchorProvider);
      const anchorProgram = new Program(idl as any, PROGRAM_ID, anchorProvider);
      setProgram(anchorProgram);
    }
  }, [publicKey, signTransaction]);
  
  // Update pool info whenever tokens change
  useEffect(() => {
    const loadPoolInfo = async () => {
      if (!tokenA.mint || !tokenB.mint || !program || !connection || !publicKey) {
        setPoolKey(null);
        setPoolInfo(null);
        return;
      }
      
      try {
        // Find pool
        const tokenAMintPk = new PublicKey(tokenA.mint);
        const tokenBMintPk = new PublicKey(tokenB.mint);
        
        const [poolAddress] = await web3.PublicKey.findProgramAddress(
          [
            Buffer.from('pool'),
            tokenAMintPk.toBuffer(),
            tokenBMintPk.toBuffer(),
          ],
          PROGRAM_ID
        );
        
        setPoolKey(poolAddress);
        
        try {
          // Fetch pool account data
          const poolAccount = await program.account.pool.fetch(poolAddress);
          
          // Get pool token accounts
          const poolTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, poolAddress, true);
          const poolTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, poolAddress, true);
          
          // Get pool token balances
          const poolTokenAInfo = await getAccount(connection, poolTokenAAccount);
          const poolTokenBInfo = await getAccount(connection, poolTokenBAccount);
          
          const tokenAReserve = Number(poolTokenAInfo.amount) / Math.pow(10, tokenA.decimals);
          const tokenBReserve = Number(poolTokenBInfo.amount) / Math.pow(10, tokenB.decimals);
          
          setPoolInfo({
            tokenAReserve,
            tokenBReserve,
            price: tokenBReserve / tokenAReserve,
          });
          
          setStatus({
            message: 'Pool found and loaded',
            type: 'success'
          });
        } catch (e) {
          setPoolInfo(null);
          setStatus({
            message: 'Pool not initialized for these tokens',
            type: 'info'
          });
        }
        
        // Load user balances
        try {
          const userTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, publicKey);
          const userTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, publicKey);
          
          try {
            const tokenAInfo = await getAccount(connection, userTokenAAccount);
            setTokenA(prev => ({
              ...prev,
              balance: Number(tokenAInfo.amount) / Math.pow(10, prev.decimals)
            }));
          } catch (e) {
            setTokenA(prev => ({
              ...prev,
              balance: 0
            }));
          }
          
          try {
            const tokenBInfo = await getAccount(connection, userTokenBAccount);
            setTokenB(prev => ({
              ...prev,
              balance: Number(tokenBInfo.amount) / Math.pow(10, prev.decimals)
            }));
          } catch (e) {
            setTokenB(prev => ({
              ...prev,
              balance: 0
            }));
          }
        } catch (e) {
          console.error("Error loading balances:", e);
        }
      } catch (e: any) {
        console.error("Error loading pool:", e);
        setStatus({
          message: `Error: ${e.message}`,
          type: 'error'
        });
      }
    };
    
    loadPoolInfo();
  }, [tokenA.mint, tokenB.mint, program, connection, publicKey]);
  
  // Calculate output amount when input amount changes
  useEffect(() => {
    if (!poolInfo || !swapAmount || isNaN(parseFloat(swapAmount))) {
      setOutputAmount('');
      setIsPriceImpactHigh(false);
      return;
    }
    
    const amount = parseFloat(swapAmount);
    
    // Calculate using constant product formula: x * y = k
    if (swapDirection === 'AtoB') {
      const newTokenAReserve = poolInfo.tokenAReserve + amount;
      const constantProduct = poolInfo.tokenAReserve * poolInfo.tokenBReserve;
      const newTokenBReserve = constantProduct / newTokenAReserve;
      let output = poolInfo.tokenBReserve - newTokenBReserve;
      
      // Apply 0.3% fee
      output = output * 0.997;
      
      // Calculate price impact
      const expectedPrice = poolInfo.price;
      const executionPrice = output / amount;
      const priceImpact = Math.abs((executionPrice - expectedPrice) / expectedPrice) * 100;
      
      setIsPriceImpactHigh(priceImpact > 5);
      setOutputAmount(output.toFixed(6));
    } else {
      const newTokenBReserve = poolInfo.tokenBReserve + amount;
      const constantProduct = poolInfo.tokenAReserve * poolInfo.tokenBReserve;
      const newTokenAReserve = constantProduct / newTokenBReserve;
      let output = poolInfo.tokenAReserve - newTokenAReserve;
      
      // Apply 0.3% fee
      output = output * 0.997;
      
      // Calculate price impact
      const expectedPrice = 1 / poolInfo.price;
      const executionPrice = output / amount;
      const priceImpact = Math.abs((executionPrice - expectedPrice) / expectedPrice) * 100;
      
      setIsPriceImpactHigh(priceImpact > 5);
      setOutputAmount(output.toFixed(6));
    }
  }, [swapAmount, swapDirection, poolInfo]);
  
  const switchTokens = () => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setSwapDirection(swapDirection === 'AtoB' ? 'BtoA' : 'AtoB');
    setSwapAmount('');
    setOutputAmount('');
  };
  
  const executeSwap = async () => {
    if (!program || !connection || !publicKey || !poolKey || !poolInfo) {
      setStatus({
        message: 'Please connect wallet and select tokens',
        type: 'error'
      });
      return;
    }
    
    if (!swapAmount || parseFloat(swapAmount) <= 0 || !outputAmount || parseFloat(outputAmount) <= 0) {
      setStatus({
        message: 'Invalid swap amount',
        type: 'error'
      });
      return;
    }
    
    try {
      setStatus({
        message: 'Swapping tokens...',
        type: 'loading'
      });
      
      const tokenAMintPk = new PublicKey(tokenA.mint);
      const tokenBMintPk = new PublicKey(tokenB.mint);
      
      // Get user token accounts
      const userTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, publicKey);
      const userTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, publicKey);
      
      // Get pool token accounts
      const poolTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, poolKey, true);
      const poolTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, poolKey, true);
      
      // Convert amounts to lamports
      const inputDecimals = swapDirection === 'AtoB' ? tokenA.decimals : tokenB.decimals;
      const swapAmountLamports = new BN(parseFloat(swapAmount) * Math.pow(10, inputDecimals));
      
      // Calculate minimum output with slippage
      const outputDecimals = swapDirection === 'AtoB' ? tokenB.decimals : tokenA.decimals;
      const minAmountOut = new BN(
        parseFloat(outputAmount) * (1 - slippage / 100) * Math.pow(10, outputDecimals)
      );
      
      // Source and destination accounts
      const userSourceToken = swapDirection === 'AtoB' ? userTokenAAccount : userTokenBAccount;
      const userDestinationToken = swapDirection === 'AtoB' ? userTokenBAccount : userTokenAAccount;
      
      // Execute swap
      const tx = await program.methods
        .swap(swapAmountLamports, minAmountOut)
        .accounts({
          pool: poolKey,
          tokenAAccount: poolTokenAAccount,
          tokenBAccount: poolTokenBAccount,
          userSourceToken: userSourceToken,
          userDestinationToken: userDestinationToken,
          authority: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      
      setStatus({
        message: `Swap successful! Tx: ${tx.slice(0, 8)}...`,
        type: 'success'
      });
      
      // Reset form
      setSwapAmount('');
      setOutputAmount('');
      
      // Reload balances
      const tokenAInfo = await getAccount(connection, userTokenAAccount);
      setTokenA(prev => ({
        ...prev,
        balance: Number(tokenAInfo.amount) / Math.pow(10, prev.decimals)
      }));
      
      const tokenBInfo = await getAccount(connection, userTokenBAccount);
      setTokenB(prev => ({
        ...prev,
        balance: Number(tokenBInfo.amount) / Math.pow(10, prev.decimals)
      }));
    } catch (e: any) {
      console.error("Error swapping tokens:", e);
      setStatus({
        message: `Error: ${e.message}`,
        type: 'error'
      });
    }
  };
  
  return (
    <div className="container mx-auto max-w-lg px-4">
      <div className="card bg-white bg-opacity-20 backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Swap</h1>
        
        {/* Swap Form */}
        <div className="rounded-xl bg-white bg-opacity-20 backdrop-blur-sm p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span>From</span>
            <span className="text-sm text-black">
              Balance: {tokenA.balance.toFixed(6)} {tokenA.symbol}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <TokenSelector 
              selectedToken={tokenA}
              onSelectToken={setTokenA}
              className="bg-white bg-opacity-20 backdrop-blur-sm"
            />
            <input
              type="number"
              placeholder="0.00"
              value={swapAmount}
              onChange={(e) => setSwapAmount(e.target.value)}
              className="input flex-grow text-right text-xl bg-white bg-opacity-20 backdrop-blur-sm"
            />
          </div>
          
          {/* Swap direction button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button 
              onClick={switchTokens}
              className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-full border border-gray-300 hover:border-primary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
          
          <div className="flex justify-between items-center mb-2 mt-4">
            <span>To</span>
            <span className="text-sm text-black">
              Balance: {tokenB.balance.toFixed(6)} {tokenB.symbol}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <TokenSelector 
              selectedToken={tokenB}
              onSelectToken={setTokenB}
              className="bg-white bg-opacity-20 backdrop-blur-sm"
            />
            <input
              type="text"
              placeholder="0.00"
              value={outputAmount}
              readOnly
              className="input flex-grow text-right text-xl bg-white bg-opacity-20 backdrop-blur-sm"
            />
          </div>
        </div>
        
        {/* Price info */}
        {poolInfo && (
          <PriceInfo 
            tokenA={tokenA}
            tokenB={tokenB}
            swapDirection={swapDirection}
            poolInfo={poolInfo}
            isPriceImpactHigh={isPriceImpactHigh}
          />
        )}
        
        {/* Slippage settings */}
        <SwapSettings 
          slippage={slippage}
          setSlippage={setSlippage}
        />
        
        {/* Status message */}
        {status.type !== 'none' && (
          <div className={`p-3 rounded-lg mb-4 ${
            status.type === 'success' ? 'bg-green-900/30 text-green-300' :
            status.type === 'error' ? 'bg-red-900/30 text-red-300' :
            status.type === 'info' ? 'bg-blue-900/30 text-blue-300' :
            'bg-gray-800 text-gray-300'
          }`}>
            {status.type === 'loading' && (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>{status.message}</span>
              </div>
            )}
            {status.type !== 'loading' && status.message}
          </div>
        )}
        
        {/* Submit button */}
        <button
          onClick={executeSwap}
          disabled={!publicKey || !poolInfo || !swapAmount || parseFloat(swapAmount) <= 0 || !outputAmount}
          className="btn bg-black text-white w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!publicKey 
            ? 'Connect Wallet' 
            : !poolInfo 
              ? 'Pool Not Found'
              : !swapAmount || parseFloat(swapAmount) <= 0
                ? 'Enter an amount'
                : isPriceImpactHigh
                  ? 'Swap Anyway (High Price Impact)'
                  : 'Swap'}
        </button>
      </div>
    </div>
  );
} 