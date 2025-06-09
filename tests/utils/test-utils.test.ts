/**
 * Tests for Utility Functions
 */

import { describe, test, expect } from '@jest/globals';

describe('Utility Functions', () => {
  describe('Address Validation', () => {
    test('should validate Ethereum addresses', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b8D4431e5e04334aBb',
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '0x4200000000000000000000000000000000000006',
        '0x0000000000000000000000000000000000000000',
      ];

      const invalidAddresses = [
        '742d35Cc6634C0532925a3b8D4431e5e04334aBb', // Missing 0x
        '0x742d35Cc6634C0532925a3b8D4431e5e04334aB', // Too short
        '0x742d35Cc6634C0532925a3b8D4431e5e04334aBbb', // Too long
        '0xGGGd35Cc6634C0532925a3b8D4431e5e04334aBb', // Invalid hex
        '',
        null,
        undefined,
      ];

      const isValidAddress = (address: any): boolean => {
        if (typeof address !== 'string') return false;
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      };

      validAddresses.forEach(address => {
        expect(isValidAddress(address)).toBe(true);
      });

      invalidAddresses.forEach(address => {
        expect(isValidAddress(address)).toBe(false);
      });
    });
  });

  describe('Amount Validation', () => {
    test('should validate token amounts', () => {
      const validAmounts = [
        '0',
        '1',
        '1000000000000000000', // 1 ETH in wei
        '999999999999999999999999999', // Very large number
      ];

      const invalidAmounts = [
        '-1',
        '1.5', // Decimals not allowed for wei amounts
        'abc',
        '',
        null,
        undefined,
      ];

      const isValidAmount = (amount: any): boolean => {
        if (typeof amount !== 'string') return false;
        if (amount === '') return false;
        
        try {
          const num = BigInt(amount);
          return num >= 0n;
        } catch {
          return false;
        }
      };

      validAmounts.forEach(amount => {
        expect(isValidAmount(amount)).toBe(true);
      });

      invalidAmounts.forEach(amount => {
        expect(isValidAmount(amount)).toBe(false);
      });
    });
  });

  describe('Chain ID Validation', () => {
    test('should validate supported chain IDs', () => {
      const supportedChains = [8453, 369, 146];
      const unsupportedChains = [1, 137, 56, 10, 42161, 999];

      const isValidChainId = (chainId: any): boolean => {
        return supportedChains.includes(chainId);
      };

      supportedChains.forEach(chainId => {
        expect(isValidChainId(chainId)).toBe(true);
      });

      unsupportedChains.forEach(chainId => {
        expect(isValidChainId(chainId)).toBe(false);
      });
    });
  });

  describe('Slippage Validation', () => {
    test('should validate slippage values', () => {
      const validSlippages = [0.1, 0.5, 1.0, 2.5, 5.0];
      const invalidSlippages = [-1, 0, 10.1, 50, 100, NaN, Infinity];

      const isValidSlippage = (slippage: any): boolean => {
        if (typeof slippage !== 'number') return false;
        if (isNaN(slippage) || !isFinite(slippage)) return false;
        return slippage > 0 && slippage <= 10;
      };

      validSlippages.forEach(slippage => {
        expect(isValidSlippage(slippage)).toBe(true);
      });

      invalidSlippages.forEach(slippage => {
        expect(isValidSlippage(slippage)).toBe(false);
      });
    });
  });

  describe('Token Symbol Resolution', () => {
    test('should resolve common token symbols', () => {
      const tokenMap = {
        'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        'WETH': '0x4200000000000000000000000000000000000006',
        '9MM': '0x9mm...',
      };

      const resolveToken = (token: string): string => {
        if (token.startsWith('0x')) return token;
        return tokenMap[token as keyof typeof tokenMap] || token;
      };

      expect(resolveToken('USDC')).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
      expect(resolveToken('0x1234567890abcdef')).toBe('0x1234567890abcdef');
      expect(resolveToken('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('Gas Price Conversion', () => {
    test('should convert gwei to wei', () => {
      const gweiToWei = (gwei: string): string => {
        return (BigInt(parseFloat(gwei) * 1e9)).toString();
      };

      expect(gweiToWei('1')).toBe('1000000000');
      expect(gweiToWei('0.1')).toBe('100000000');
      expect(gweiToWei('10')).toBe('10000000000');
    });

    test('should calculate gas cost', () => {
      const calculateGasCost = (gasLimit: string, gasPrice: string): string => {
        return (BigInt(gasLimit) * BigInt(gasPrice)).toString();
      };

      expect(calculateGasCost('21000', '1000000000')).toBe('21000000000000');
      expect(calculateGasCost('180000', '100000000')).toBe('18000000000000');
    });
  });

  describe('Percentage Calculations', () => {
    test('should calculate slippage amounts', () => {
      const calculateSlippage = (amount: string, slippagePercent: number): string => {
        const amountBN = BigInt(amount);
        const slippageBN = BigInt(Math.floor(slippagePercent * 100)); // To basis points
        return (amountBN * (10000n - slippageBN) / 10000n).toString();
      };

      // 1000 with 0.5% slippage should be 995
      expect(calculateSlippage('1000', 0.5)).toBe('995');
      
      // 1 ETH with 1% slippage
      expect(calculateSlippage('1000000000000000000', 1))
        .toBe('990000000000000000');
    });

    test('should calculate price impact', () => {
      const calculatePriceImpact = (expectedAmount: string, actualAmount: string): number => {
        const expected = BigInt(expectedAmount);
        const actual = BigInt(actualAmount);
        
        if (expected === 0n) return 0;
        
        const diff = expected - actual;
        const impact = Number(diff * 10000n / expected) / 100; // Convert to percentage
        return Math.abs(impact);
      };

      expect(calculatePriceImpact('1000', '995')).toBe(0.5);
      expect(calculatePriceImpact('1000000000000000000', '990000000000000000')).toBe(1);
    });
  });

  describe('Number Formatting', () => {
    test('should format large numbers', () => {
      const formatAmount = (amount: string, decimals: number = 18): string => {
        const amountBN = BigInt(amount);
        const divisor = BigInt(10 ** decimals);
        const whole = amountBN / divisor;
        const remainder = amountBN % divisor;
        
        if (remainder === 0n) {
          return whole.toString();
        }
        
        const remainderStr = remainder.toString().padStart(decimals, '0');
        const trimmed = remainderStr.replace(/0+$/, '');
        return `${whole}.${trimmed}`;
      };

      expect(formatAmount('1000000000000000000', 18)).toBe('1'); // 1 ETH
      expect(formatAmount('1500000000000000000', 18)).toBe('1.5'); // 1.5 ETH
      expect(formatAmount('1000000', 6)).toBe('1'); // 1 USDC
    });

    test('should format percentages', () => {
      const formatPercent = (decimal: number): string => {
        return (decimal * 100).toFixed(2) + '%';
      };

      expect(formatPercent(0.0017)).toBe('0.17%');
      expect(formatPercent(0.005)).toBe('0.50%');
      expect(formatPercent(0.1)).toBe('10.00%');
    });
  });

  describe('Time Utilities', () => {
    test('should create deadline timestamps', () => {
      const createDeadline = (minutesFromNow: number): number => {
        return Math.floor(Date.now() / 1000) + (minutesFromNow * 60);
      };

      const now = Math.floor(Date.now() / 1000);
      const deadline = createDeadline(20);
      
      expect(deadline).toBeGreaterThan(now);
      expect(deadline).toBeLessThanOrEqual(now + 1200); // 20 minutes
    });

    test('should validate deadline', () => {
      const isValidDeadline = (deadline: number): boolean => {
        const now = Math.floor(Date.now() / 1000);
        return deadline > now && deadline <= now + 3600; // Within 1 hour
      };

      const now = Math.floor(Date.now() / 1000);
      
      expect(isValidDeadline(now + 600)).toBe(true); // 10 minutes from now
      expect(isValidDeadline(now - 600)).toBe(false); // 10 minutes ago
      expect(isValidDeadline(now + 7200)).toBe(false); // 2 hours from now
    });
  });

  describe('Error Formatting', () => {
    test('should format user-friendly error messages', () => {
      const formatError = (error: Error): string => {
        const message = error.message.toLowerCase();
        
        if (message.includes('insufficient')) {
          return 'Insufficient funds or liquidity';
        }
        if (message.includes('slippage')) {
          return 'Price moved too much (slippage exceeded)';
        }
        if (message.includes('deadline')) {
          return 'Transaction deadline exceeded';
        }
        if (message.includes('network')) {
          return 'Network connection error';
        }
        
        return 'Transaction failed';
      };

      expect(formatError(new Error('Insufficient reserves')))
        .toBe('Insufficient funds or liquidity');
      expect(formatError(new Error('Slippage too high')))
        .toBe('Price moved too much (slippage exceeded)');
      expect(formatError(new Error('Unknown error')))
        .toBe('Transaction failed');
    });
  });

  describe('Route Optimization', () => {
    test('should find optimal trading route', () => {
      interface Quote {
        chainId: number;
        toAmount: string;
        priceImpact: number;
        fee: number;
        gasEstimate: string;
      }

      const findBestQuote = (quotes: Quote[]): Quote | null => {
        if (quotes.length === 0) return null;
        
        // Score based on output amount minus gas costs and price impact
        const scoredQuotes = quotes.map(quote => {
          const outputValue = Number(quote.toAmount);
          const gasCost = Number(quote.gasEstimate) * 0.1; // Simplified gas cost
          const impactPenalty = outputValue * quote.priceImpact / 100;
          
          return {
            ...quote,
            score: outputValue - gasCost - impactPenalty,
          };
        });

        return scoredQuotes.reduce((best, current) => 
          current.score > best.score ? current : best
        );
      };

      const quotes: Quote[] = [
        { chainId: 8453, toAmount: '1000', priceImpact: 0.1, fee: 0.0017, gasEstimate: '180000' },
        { chainId: 369, toAmount: '995', priceImpact: 0.15, fee: 0.0017, gasEstimate: '150000' },
        { chainId: 146, toAmount: '998', priceImpact: 0.12, fee: 0.0017, gasEstimate: '160000' },
      ];

      const best = findBestQuote(quotes);
      expect(best).toBeDefined();
      expect(best?.chainId).toBe(8453); // Highest amount should win
    });
  });
}); 