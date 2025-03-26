'use client';

import { useState } from 'react';

interface SwapSettingsProps {
  slippage: number;
  setSlippage: (value: number) => void;
}

export function SwapSettings({ slippage, setSlippage }: SwapSettingsProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [customSlippage, setCustomSlippage] = useState<string>(slippage.toString());
  
  const slippageOptions = [0.1, 0.5, 1.0, 3.0];
  
  const handleCustomSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSlippage(e.target.value);
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setSlippage(value);
    }
  };
  
  const handleSlippageOptionClick = (value: number) => {
    setSlippage(value);
    setCustomSlippage(value.toString());
  };
  
  return (
    <div className="mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        <span>Settings</span>
      </button>
      
      {isOpen && (
        <div className="mt-2 p-4 bg-card rounded-xl">
          <h3 className="font-medium mb-3">Transaction Settings</h3>
          
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Slippage Tolerance</label>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {slippageOptions.map(option => (
                <button
                  key={option}
                  onClick={() => handleSlippageOptionClick(option)}
                  className={`px-3 py-1 rounded-md text-sm ${
                    slippage === option
                      ? 'bg-primary text-white'
                      : 'bg-card-dark text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {option}%
                </button>
              ))}
              
              <div className="relative">
                <input
                  type="text"
                  value={customSlippage}
                  onChange={handleCustomSlippageChange}
                  className="bg-card-dark px-3 py-1 rounded-md text-sm w-20 pr-6"
                  placeholder="Custom"
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm">%</span>
              </div>
            </div>
            
            {parseFloat(customSlippage) > 5 && (
              <p className="text-yellow-500 text-sm">
                Your transaction may be frontrun and result in an unfavorable trade.
              </p>
            )}
            
            {parseFloat(customSlippage) < 0.1 && parseFloat(customSlippage) > 0 && (
              <p className="text-yellow-500 text-sm">
                Your transaction may fail due to price movements.
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Transaction Deadline</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="bg-card-dark px-3 py-1 rounded-md text-sm w-20"
                placeholder="30"
                defaultValue="30"
              />
              <span className="text-sm text-gray-400">minutes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 