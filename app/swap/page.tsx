'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';
import { TokenSelector } from '@/components/TokenSelector';
import { PriceInfo } from '@/components/PriceInfo';
import { SwapSettings } from '@/components/SwapSettings';

// Constants
const ENDPOINT = 'https://api.devnet.solana.com';

// Known token mints on devnet
const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'); // Example devnet USDC

export default function SwapPage() {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [connection] = useState(new Connection(ENDPOINT));
  
  // Keep existing state management for UI
  const [tokenA, setTokenA] = useState({
    symbol: 'SOL',
    mint: WRAPPED_SOL_MINT.toBase58(),
    balance: 0,
    decimals: 9
  });
  
  const [tokenB, setTokenB] = useState({
    symbol: 'USDC',
    mint: USDC_MINT.toBase58(),
    balance: 0,
    decimals: 9
  });
  
  const [swapAmount, setSwapAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [status, setStatus] = useState({
    message: '',
    type: 'none'
  });

  // Fetch balances
  useEffect(() => {
    const getBalances = async () => {
      if (!publicKey || !connection) return;

      try {
        // Get SOL balance
        const solBalance = await connection.getBalance(publicKey);
        setTokenA(prev => ({
          ...prev,
          balance: solBalance / LAMPORTS_PER_SOL
        }));

        // Get Token B balance
        if (tokenB.mint) {
          try {
            const tokenBAccount = await getAssociatedTokenAddress(
              new PublicKey(tokenB.mint),
              publicKey
            );
            const tokenBAccountInfo = await getAccount(connection, tokenBAccount);
            setTokenB(prev => ({
              ...prev,
              balance: Number(tokenBAccountInfo.amount) / Math.pow(10, prev.decimals)
            }));
          } catch (e) {
            setTokenB(prev => ({
              ...prev,
              balance: 0
            }));
          }
        }
      } catch (e) {
        console.error("Error fetching balances:", e);
      }
    };

    getBalances();
  }, [publicKey, connection, tokenB.mint]);

  const executeSwap = async () => {
    if (!publicKey || !signTransaction || !sendTransaction) {
      setStatus({
        message: 'Please connect wallet',
        type: 'error'
      });
      return;
    }

    try {
      setStatus({
        message: 'Preparing swap...',
        type: 'loading'
      });

      const transaction = new Transaction();
      
      if (tokenA.symbol === 'SOL') {
        // SOL to Token swap
        const destinationAta = await getAssociatedTokenAddress(
          new PublicKey(tokenB.mint),
          publicKey
        );

        // Check if destination token account exists
        try {
          await getAccount(connection, destinationAta);
        } catch (e) {
          // If account doesn't exist, create it
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey,
              destinationAta,
              publicKey,
              new PublicKey(tokenB.mint)
            )
          );
        }

        // Add SOL transfer instruction
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: destinationAta,
            lamports: Math.floor(parseFloat(swapAmount) * LAMPORTS_PER_SOL)
          })
        );
      } else {
        // Token to SOL swap
        const sourceAta = await getAssociatedTokenAddress(
          new PublicKey(tokenA.mint),
          publicKey
        );

        // Add token transfer instruction
        transaction.add(
          createTransferInstruction(
            sourceAta,
            publicKey,
            publicKey,
            Math.floor(parseFloat(swapAmount) * Math.pow(10, tokenA.decimals))
          )
        );
      }

      // Add recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send and confirm transaction
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      setStatus({
        message: (
          <span>
            Swap successful! Tx:{' '}
            <a 
              href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              {signature.slice(0, 8)}...
            </a>
          </span>
        ),
        type: 'success'
      });

      // Reset form
      setSwapAmount('');
      setOutputAmount('');

    } catch (e: any) {
      console.error("Error swapping tokens:", e);
      setStatus({
        message: `Error: ${e.message}`,
        type: 'error'
      });
    }
  };

  // Keep the exact same return statement for the UI
  return (
    <div className="container mx-auto max-w-lg px-4">
      <div className="card bg-white bg-opacity-20 backdrop-blur-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Swap</h1>
        
        {/* Keep all existing UI components */}
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
        <PriceInfo 
          tokenA={tokenA}
          tokenB={tokenB}
          swapDirection={'AtoB'}
          poolInfo={null}
          isPriceImpactHigh={false}
        />
        
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
            {status.type !== 'loading' && (
              typeof status.message === 'string' 
                ? status.message 
                : status.message
            )}
          </div>
        )}
        
        {/* Submit button */}
        <button
          onClick={executeSwap}
          disabled={!publicKey || !swapAmount || parseFloat(swapAmount) <= 0}
          className="btn bg-black text-white w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!publicKey 
            ? 'Connect Wallet' 
            : !swapAmount || parseFloat(swapAmount) <= 0
              ? 'Enter an amount'
              : 'Swap'}
        </button>
      </div>
    </div>
  );
} 