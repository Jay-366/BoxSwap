// pages/index.tsx
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@project-serum/anchor';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  getAccount, 
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import * as idl from '../idl/liquidity_pool.json';

// Constants
const PROGRAM_ID = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS');
const ENDPOINT = 'https://api.devnet.solana.com';

export default function Home() {
  const { publicKey, signTransaction } = useWallet();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  
  // Pool information
  const [tokenAMint, setTokenAMint] = useState<string>('');
  const [tokenBMint, setTokenBMint] = useState<string>('');
  const [poolKey, setPoolKey] = useState<PublicKey | null>(null);
  
  // Balances
  const [tokenABalance, setTokenABalance] = useState<number>(0);
  const [tokenBBalance, setTokenBBalance] = useState<number>(0);
  
  // Input values
  const [tokenAAmount, setTokenAAmount] = useState<string>('');
  const [tokenBAmount, setTokenBAmount] = useState<string>('');
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [swapDirection, setSwapDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
  const [slippage, setSlippage] = useState<string>('0.5');
  
  // Status messages
  const [status, setStatus] = useState<string>('');
  
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
          signAllTransactions: async (txs) => {
            return txs.map(tx => signTransaction(tx));
          },
        },
        { commitment: 'processed' }
      );
      
      setProvider(anchorProvider);
      const anchorProgram = new Program(idl as any, PROGRAM_ID, anchorProvider);
      setProgram(anchorProgram);
    }
  }, [publicKey, signTransaction]);
  
  // Load pool information if mints are set
  useEffect(() => {
    const loadPoolInfo = async () => {
      if (!tokenAMint || !tokenBMint || !program || !connection || !publicKey) return;
      
      try {
        // Try to find the pool
        const tokenAMintPk = new PublicKey(tokenAMint);
        const tokenBMintPk = new PublicKey(tokenBMint);
        
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
          // Try to fetch pool account data
          const poolAccount = await program.account.pool.fetch(poolAddress);
          setStatus(`Pool found! Token A: ${poolAccount.tokenAMint.toString().slice(0, 8)}... Token B: ${poolAccount.tokenBMint.toString().slice(0, 8)}...`);
          
          // Load balances
          const tokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, publicKey);
          const tokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, publicKey);
          
          try {
            const tokenAInfo = await getAccount(connection, tokenAAccount);
            setTokenABalance(Number(tokenAInfo.amount) / 1e9); // Adjust based on token decimals
          } catch (e) {
            setTokenABalance(0);
          }
          
          try {
            const tokenBInfo = await getAccount(connection, tokenBAccount);
            setTokenBBalance(Number(tokenBInfo.amount) / 1e9); // Adjust based on token decimals
          } catch (e) {
            setTokenBBalance(0);
          }
        } catch (e) {
          setStatus(`Pool not initialized yet with these tokens.`);
        }
      } catch (e) {
        console.error("Error loading pool:", e);
        setStatus(`Error: ${e.message}`);
      }
    };
    
    loadPoolInfo();
  }, [tokenAMint, tokenBMint, program, connection, publicKey]);
  
  const initializePool = async () => {
    if (!program || !connection || !publicKey || !tokenAMint || !tokenBMint) {
      setStatus('Please connect wallet and set token mints');
      return;
    }
    
    try {
      setStatus('Initializing pool...');
      
      const tokenAMintPk = new PublicKey(tokenAMint);
      const tokenBMintPk = new PublicKey(tokenBMint);
      
      // Get pool address
      const [poolAddress, bump] = await web3.PublicKey.findProgramAddress(
        [
          Buffer.from('pool'),
          tokenAMintPk.toBuffer(),
          tokenBMintPk.toBuffer(),
        ],
        PROGRAM_ID
      );
      
      // Get user token accounts
      const userTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, publicKey);
      const userTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, publicKey);
      
      // Get pool token accounts
      const poolTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, poolAddress, true);
      const poolTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, poolAddress, true);
      
      // Create transaction
      const tx = new Transaction();
      
      // Check if pool token accounts exist, if not create them
      try {
        await getAccount(connection, poolTokenAAccount);
      } catch (e) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            poolTokenAAccount,
            poolAddress,
            tokenAMintPk
          )
        );
      }
      
      try {
        await getAccount(connection, poolTokenBAccount);
      } catch (e) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            poolTokenBAccount,
            poolAddress,
            tokenBMintPk
          )
        );
      }
      
      // Parse token amounts
      const tokenAAmountLamports = new BN(parseFloat(tokenAAmount) * 1e9); // Adjust based on token decimals
      const tokenBAmountLamports = new BN(parseFloat(tokenBAmount) * 1e9); // Adjust based on token decimals
      
      // Add initialize pool instruction
      tx.add(
        await program.methods
          .initializePool(tokenAAmountLamports, tokenBAmountLamports)
          .accounts({
            pool: poolAddress,
            tokenAMint: tokenAMintPk,
            tokenBMint: tokenBMintPk,
            tokenAAccount: poolTokenAAccount,
            tokenBAccount: poolTokenBAccount,
            userTokenAAccount: userTokenAAccount,
            userTokenBAccount: userTokenBAccount,
            authority: publicKey,
            systemProgram: web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .instruction()
      );
      
      // Send transaction
      const signature = await provider.sendAndConfirm(tx);
      setStatus(`Pool initialized! Transaction: ${signature}`);
      setPoolKey(poolAddress);
      
      // Refresh balances
      const tokenAInfo = await getAccount(connection, userTokenAAccount);
      setTokenABalance(Number(tokenAInfo.amount) / 1e9);
      
      const tokenBInfo = await getAccount(connection, userTokenBAccount);
      setTokenBBalance(Number(tokenBInfo.amount) / 1e9);
    } catch (e) {
      console.error("Error initializing pool:", e);
      setStatus(`Error: ${e.message}`);
    }
  };
  
  const addLiquidity = async () => {
    if (!program || !connection || !publicKey || !poolKey) {
      setStatus('Please connect wallet and initialize pool first');
      return;
    }
    
    try {
      setStatus('Adding liquidity...');
      
      const tokenAMintPk = new PublicKey(tokenAMint);
      const tokenBMintPk = new PublicKey(tokenBMint);
      
      // Get user token accounts
      const userTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, publicKey);
      const userTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, publicKey);
      
      // Get pool token accounts
      const poolTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, poolKey, true);
      const poolTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, poolKey, true);
      
      // Parse token amounts
      const tokenAAmountLamports = new BN(parseFloat(tokenAAmount) * 1e9); // Adjust based on token decimals
      const tokenBAmountLamports = new BN(parseFloat(tokenBAmount) * 1e9); // Adjust based on token decimals
      
      // Get pool data
      const poolData = await program.account.pool.fetch(poolKey);
      
      // Add liquidity instruction
      const tx = await program.methods
        .addLiquidity(tokenAAmountLamports, tokenBAmountLamports)
        .accounts({
          pool: poolKey,
          tokenAAccount: poolTokenAAccount,
          tokenBAccount: poolTokenBAccount,
          userTokenAAccount: userTokenAAccount,
          userTokenBAccount: userTokenBAccount,
          authority: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      
      setStatus(`Liquidity added! Transaction: ${tx}`);
      
      // Refresh balances
      const tokenAInfo = await getAccount(connection, userTokenAAccount);
      setTokenABalance(Number(tokenAInfo.amount) / 1e9);
      
      const tokenBInfo = await getAccount(connection, userTokenBAccount);
      setTokenBBalance(Number(tokenBInfo.amount) / 1e9);
    } catch (e) {
      console.error("Error adding liquidity:", e);
      setStatus(`Error: ${e.message}`);
    }
  };
  
  const swap = async () => {
    if (!program || !connection || !publicKey || !poolKey) {
      setStatus('Please connect wallet and initialize pool first');
      return;
    }
    
    try {
      setStatus('Swapping tokens...');
      
      const tokenAMintPk = new PublicKey(tokenAMint);
      const tokenBMintPk = new PublicKey(tokenBMint);
      
      // Get user token accounts
      const userTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, publicKey);
      const userTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, publicKey);
      
      // Get pool token accounts
      const poolTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, poolKey, true);
      const poolTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, poolKey, true);
      
      // Get pool data
      const poolData = await program.account.pool.fetch(poolKey);
      
      // Get pool token balances
      const poolTokenAInfo = await getAccount(connection, poolTokenAAccount);
      const poolTokenBInfo = await getAccount(connection, poolTokenBAccount);
      
      // Parse swap amount
      const swapAmountLamports = new BN(parseFloat(swapAmount) * 1e9); // Adjust based on token decimals
      
      // Calculate expected output based on constant product formula
      const tokenAReserve = Number(poolTokenAInfo.amount);
      const tokenBReserve = Number(poolTokenBInfo.amount);
      const constantProduct = tokenAReserve * tokenBReserve;
      
      let expectedOutput;
      if (swapDirection === 'AtoB') {
        // A to B swap
        const newTokenAReserve = tokenAReserve + Number(swapAmountLamports);
        const newTokenBReserve = constantProduct / newTokenAReserve;
        expectedOutput = tokenBReserve - newTokenBReserve;
      } else {
        // B to A swap
        const newTokenBReserve = tokenBReserve + Number(swapAmountLamports);
        const newTokenAReserve = constantProduct / newTokenBReserve;
        expectedOutput = tokenAReserve - newTokenAReserve;
      }
      
      // Apply fee
      expectedOutput = expectedOutput * 0.997; // 0.3% fee
      
      // Apply slippage tolerance
      const minAmountOut = new BN(expectedOutput * (1 - parseFloat(slippage) / 100));
      
      // Prepare accounts for swap
      const accounts = {
        pool: poolKey,
        tokenAAccount: poolTokenAAccount,
        tokenBAccount: poolTokenBAccount,
        authority: publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      };
      
      if (swapDirection === 'AtoB') {
        accounts.userSourceToken = userTokenAAccount;
        accounts.userDestinationToken = userTokenBAccount;
      } else {
        accounts.userSourceToken = userTokenBAccount;
        accounts.userDestinationToken = userTokenAAccount;
      }
      
      // Execute swap
      const tx = await program.methods
        .swap(swapAmountLamports, minAmountOut)
        .accounts(accounts)
        .rpc();
      
      setStatus(`Swap executed! Transaction: ${tx}`);
      
      // Refresh balances
      const tokenAInfo = await getAccount(connection, userTokenAAccount);
      setTokenABalance(Number(tokenAInfo.amount) / 1e9);
      
      const tokenBInfo = await getAccount(connection, userTokenB


// pages/index.tsx (continued)
const tokenBInfo = await getAccount(connection, userTokenBAccount);
setTokenBBalance(Number(tokenBInfo.amount) / 1e9);
} catch (e) {
console.error("Error swapping tokens:", e);
setStatus(`Error: ${e.message}`);
}
};

const removeLiquidity = async () => {
if (!program || !connection || !publicKey || !poolKey) {
setStatus('Please connect wallet and initialize pool first');
return;
}

try {
setStatus('Removing liquidity...');

const tokenAMintPk = new PublicKey(tokenAMint);
const tokenBMintPk = new PublicKey(tokenBMint);

// Get user token accounts
const userTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, publicKey);
const userTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, publicKey);

// Get pool token accounts
const poolTokenAAccount = await getAssociatedTokenAddress(tokenAMintPk, poolKey, true);
const poolTokenBAccount = await getAssociatedTokenAddress(tokenBMintPk, poolKey, true);

// Parse token amounts
const tokenAAmountLamports = new BN(parseFloat(tokenAAmount) * 1e9); // Adjust based on token decimals
const tokenBAmountLamports = new BN(parseFloat(tokenBAmount) * 1e9); // Adjust based on token decimals

// Get pool data
const poolData = await program.account.pool.fetch(poolKey);

// Remove liquidity instruction
const tx = await program.methods
  .removeLiquidity(tokenAAmountLamports, tokenBAmountLamports)
  .accounts({
    pool: poolKey,
    tokenAAccount: poolTokenAAccount,
    tokenBAccount: poolTokenBAccount,
    userTokenAAccount: userTokenAAccount,
    userTokenBAccount: userTokenBAccount,
    authority: publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();

setStatus(`Liquidity removed! Transaction: ${tx}`);

// Refresh balances
const tokenAInfo = await getAccount(connection, userTokenAAccount);
setTokenABalance(Number(tokenAInfo.amount) / 1e9);

const tokenBInfo = await getAccount(connection, userTokenBAccount);
setTokenBBalance(Number(tokenBInfo.amount) / 1e9);
} catch (e) {
console.error("Error removing liquidity:", e);
setStatus(`Error: ${e.message}`);
}
};

return (
<div className="container mx-auto p-4">
<h1 className="text-2xl font-bold mb-6">Solana Liquidity Pool</h1>

<div className="mb-6">
  <div className="flex justify-end mb-4">
    <WalletMultiButton />
  </div>
  
  {publicKey ? (
    <div className="bg-green-100 p-2 rounded">
      Connected: {publicKey.toString().slice(0, 8)}...
    </div>
  ) : (
    <div className="bg-yellow-100 p-2 rounded">
      Please connect your wallet
    </div>
  )}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="border p-4 rounded">
    <h2 className="text-xl font-semibold mb-4">Pool Configuration</h2>
    
    <div className="mb-4">
      <label className="block mb-1">Token A Mint</label>
      <input 
        type="text"
        className="w-full p-2 border rounded"
        value={tokenAMint}
        onChange={(e) => setTokenAMint(e.target.value)}
        placeholder="Enter Token A mint address"
      />
    </div>
    
    <div className="mb-4">
      <label className="block mb-1">Token B Mint</label>
      <input 
        type="text"
        className="w-full p-2 border rounded"
        value={tokenBMint}
        onChange={(e) => setTokenBMint(e.target.value)}
        placeholder="Enter Token B mint address"
      />
    </div>
    
    <div className="mb-4">
      <p>Your Balances:</p>
      <p>Token A: {tokenABalance.toFixed(4)}</p>
      <p>Token B: {tokenBBalance.toFixed(4)}</p>
    </div>
    
    <div className="mb-4">
      <p>Pool Status: {poolKey ? `Found (${poolKey.toString().slice(0, 8)}...)` : 'Not initialized'}</p>
    </div>
  </div>
  
  <div className="border p-4 rounded">
    <h2 className="text-xl font-semibold mb-4">Initialize Pool</h2>
    
    <div className="mb-4">
      <label className="block mb-1">Initial Token A Amount</label>
      <input 
        type="number"
        step="0.000001"
        className="w-full p-2 border rounded"
        value={tokenAAmount}
        onChange={(e) => setTokenAAmount(e.target.value)}
        placeholder="Amount of Token A"
      />
    </div>
    
    <div className="mb-4">
      <label className="block mb-1">Initial Token B Amount</label>
      <input 
        type="number"
        step="0.000001"
        className="w-full p-2 border rounded"
        value={tokenBAmount}
        onChange={(e) => setTokenBAmount(e.target.value)}
        placeholder="Amount of Token B"
      />
    </div>
    
    <button 
      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      onClick={initializePool}
      disabled={!publicKey || !tokenAMint || !tokenBMint || !tokenAAmount || !tokenBAmount}
    >
      Initialize Pool
    </button>
  </div>
  
  <div className="border p-4 rounded">
    <h2 className="text-xl font-semibold mb-4">Add/Remove Liquidity</h2>
    
    <div className="mb-4">
      <label className="block mb-1">Token A Amount</label>
      <input 
        type="number"
        step="0.000001"
        className="w-full p-2 border rounded"
        value={tokenAAmount}
        onChange={(e) => setTokenAAmount(e.target.value)}
        placeholder="Amount of Token A"
      />
    </div>
    
    <div className="mb-4">
      <label className="block mb-1">Token B Amount</label>
      <input 
        type="number"
        step="0.000001"
        className="w-full p-2 border rounded"
        value={tokenBAmount}
        onChange={(e) => setTokenBAmount(e.target.value)}
        placeholder="Amount of Token B"
      />
    </div>
    
    <div className="flex space-x-4">
      <button 
        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        onClick={addLiquidity}
        disabled={!publicKey || !poolKey || !tokenAAmount || !tokenBAmount}
      >
        Add Liquidity
      </button>
      
      <button 
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        onClick={removeLiquidity}
        disabled={!publicKey || !poolKey || !tokenAAmount || !tokenBAmount}
      >
        Remove Liquidity
      </button>
    </div>
  </div>
  
  <div className="border p-4 rounded">
    <h2 className="text-xl font-semibold mb-4">Swap Tokens</h2>
    
    <div className="mb-4">
      <label className="block mb-1">Direction</label>
      <select
        className="w-full p-2 border rounded"
        value={swapDirection}
        onChange={(e) => setSwapDirection(e.target.value as 'AtoB' | 'BtoA')}
      >
        <option value="AtoB">Token A to Token B</option>
        <option value="BtoA">Token B to Token A</option>
      </select>
    </div>
    
    <div className="mb-4">
      <label className="block mb-1">Amount to Swap</label>
      <input 
        type="number"
        step="0.000001"
        className="w-full p-2 border rounded"
        value={swapAmount}
        onChange={(e) => setSwapAmount(e.target.value)}
        placeholder={`Amount of Token ${swapDirection === 'AtoB' ? 'A' : 'B'}`}
      />
    </div>
    
    <div className="mb-4">
      <label className="block mb-1">Slippage Tolerance (%)</label>
      <input 
        type="number"
        step="0.1"
        className="w-full p-2 border rounded"
        value={slippage}
        onChange={(e) => setSlippage(e.target.value)}
        placeholder="Slippage tolerance percentage"
      />
    </div>
    
    <button 
      className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
      onClick={swap}
      disabled={!publicKey || !poolKey || !swapAmount}
    >
      Swap
    </button>
  </div>
</div>

<div className="mt-6">
  <h2 className="text-xl font-semibold mb-2">Status</h2>
  <div className="bg-gray-100 p-4 rounded">
    {status || 'Ready'}
  </div>
</div>
</div>
);
}