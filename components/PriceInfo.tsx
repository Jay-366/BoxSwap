'use client';

interface PriceInfoProps {
  tokenA: {
    symbol: string;
    mint: string;
    balance: number;
    decimals: number;
  };
  tokenB: {
    symbol: string;
    mint: string;
    balance: number;
    decimals: number;
  };
  swapDirection: 'AtoB' | 'BtoA';
  poolInfo: {
    price: number;
    tokenAReserve: number;
    tokenBReserve: number;
  } | null;
  isPriceImpactHigh: boolean;
}

export function PriceInfo({ tokenA, tokenB, swapDirection, poolInfo, isPriceImpactHigh }: PriceInfoProps) {
  if (!poolInfo) return null; // Early return if no pool info

  // Calculate the display price
  const price = swapDirection === 'AtoB' 
    ? poolInfo.price 
    : 1 / poolInfo.price;
  
  // Determine which tokens to show
  const sourceToken = swapDirection === 'AtoB' ? tokenA : tokenB;
  const destinationToken = swapDirection === 'AtoB' ? tokenB : tokenA;
  
  // Format the price to reasonable number of decimal places
  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toExponential(4);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return Math.round(price).toLocaleString();
  };
  
  return (
    <div className="p-4 rounded-xl bg-card mb-4">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Rate</span>
          <span className="font-medium">
            1 {sourceToken.symbol} = {formatPrice(price)} {destinationToken.symbol}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Pool Liquidity</span>
          <span className="font-medium">
            {poolInfo.tokenAReserve.toFixed(2)} {tokenA.symbol} / {poolInfo.tokenBReserve.toFixed(2)} {tokenB.symbol}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Swap Fee</span>
          <span className="font-medium">0.3%</span>
        </div>
        
        {isPriceImpactHigh && (
          <div className="mt-2 p-2 bg-red-900/30 text-red-300 rounded">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>High price impact! Swap results in significant slippage.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 