'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

export default function StakePage() {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStake = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement staking logic
      alert('Staking coming soon!');
    } catch (error) {
      console.error('Error staking:', error);
      alert('Failed to stake. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement unstaking logic
      alert('Unstaking coming soon!');
    } catch (error) {
      console.error('Error unstaking:', error);
      alert('Failed to unstake. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Stake LP Tokens</h2>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount to stake/unstake"
            className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleStake}
            disabled={loading || !amount || Number(amount) <= 0}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
              loading || !amount || Number(amount) <= 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {loading ? 'Processing...' : 'Stake'}
          </button>

          <button
            onClick={handleUnstake}
            disabled={loading || !amount || Number(amount) <= 0}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
              loading || !amount || Number(amount) <= 0
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {loading ? 'Processing...' : 'Unstake'}
          </button>
        </div>

        {/* Staking Info */}
        <div className="mt-8 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Staking Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Staked</span>
              <span>0.00 LP Tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Available to Stake</span>
              <span>0.00 LP Tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Staking APR</span>
              <span>8.45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rewards Earned</span>
              <span>0.00 BONK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 