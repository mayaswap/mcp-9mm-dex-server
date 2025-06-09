/**
 * Tests for NineMMService
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock ethers.js before importing the service
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn(),
    Contract: jest.fn(),
    ZeroAddress: '0x0000000000000000000000000000000000000000',
  },
}));

// Mock the config
jest.mock('../../src/config/9mm-config', () => ({
  get9MMConfig: jest.fn(),
  getAllSupported9MMChains: jest.fn(),
  NINE_MM_FEES: {
    v2: 0.0017,
    v3: { low: 0.0005, medium: 0.003, high: 0.01 },
    aggregator: 0.001,
  },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { NineMMService } from '../../src/services/nine-mm-service';
import { get9MMConfig, getAllSupported9MMChains } from '../../src/config/9mm-config';
import { ethers } from 'ethers';

describe('NineMMService', () => {
  let service: NineMMService;
  let mockProvider: any;
  let mockContract: any;
  let mockSigner: any;

  const testConfig = {
    chainId: 8453,
    name: 'Base',
    nativeCurrency: 'ETH',
    rpcUrl: 'https://base-mainnet.test.com',
    blockExplorer: 'https://basescan.org',
    contracts: {
      factory: '0xfactory123',
      router: '0xrouter123',
      multicall: '0xmulticall123',
    },
    features: { v2: true, v3: true, aggregator: true },
    gasSettings: { gasPrice: '0.1', gasLimit: 300000 },
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock provider
    mockProvider = {
      getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
      getNetwork: jest.fn().mockResolvedValue({ chainId: 8453 }),
    };

    // Setup mock contract
    mockContract = {
      getAmountsOut: jest.fn().mockResolvedValue(['1000000000', '2000000000000000000']),
      getReserves: jest.fn().mockResolvedValue({
        _reserve0: '5000000000000',
        _reserve1: '1750000000000000000',
      }),
      totalSupply: jest.fn().mockResolvedValue('2915475906000000'),
      balanceOf: jest.fn().mockResolvedValue('100000000000000000000'),
      getPair: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678'),
      getFunction: jest.fn().mockReturnValue({
        estimateGas: jest.fn().mockResolvedValue('180000'),
      }),
      swapExactTokensForTokens: jest.fn().mockResolvedValue({
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      }),
      addLiquidity: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({ status: 1 }),
      }),
    };

    // Setup mock signer
    mockSigner = {};

    // Mock ethers constructors
    (ethers.JsonRpcProvider as jest.Mock).mockReturnValue(mockProvider);
    (ethers.Contract as jest.Mock).mockReturnValue(mockContract);

    // Mock config functions
    (get9MMConfig as jest.Mock).mockReturnValue(testConfig);
    (getAllSupported9MMChains as jest.Mock).mockReturnValue([testConfig]);

    // Create service instance
    service = new NineMMService();
  });

  describe('Initialization', () => {
    test('should initialize providers for all supported chains', () => {
      expect(getAllSupported9MMChains).toHaveBeenCalled();
      expect(ethers.JsonRpcProvider).toHaveBeenCalledWith(testConfig.rpcUrl);
    });

    test('should handle provider initialization errors gracefully', () => {
      const errorConfig = { ...testConfig, rpcUrl: 'invalid-url' };
      (getAllSupported9MMChains as jest.Mock).mockReturnValue([errorConfig]);
      (ethers.JsonRpcProvider as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid RPC URL');
      });

      // Should not throw, just log error
      expect(() => new NineMMService()).not.toThrow();
    });
  });

  describe('getSwapQuote', () => {
    const swapParams = {
      chainId: 8453,
      fromToken: '0xusdc123',
      toToken: '0xweth123',
      amount: '1000000000',
      slippage: 0.5,
      userAddress: '0xuser123',
    };

    test('should return valid swap quote', async () => {
      const quote = await service.getSwapQuote(swapParams);

      expect(quote).toMatchObject({
        chainId: 8453,
        fromToken: '0xusdc123',
        toToken: '0xweth123',
        fromAmount: '1000000000',
        toAmount: '2000000000000000000',
        priceImpact: expect.any(Number),
        fee: 0.0017,
        gasEstimate: '180000',
        route: ['0xusdc123', '0xweth123'],
        validUntil: expect.any(Number),
      });
    });

    test('should calculate slippage correctly', async () => {
      const quote = await service.getSwapQuote(swapParams);
      
      // toAmountMin should be less than toAmount due to slippage
      const toAmount = BigInt(quote.toAmount);
      const toAmountMin = BigInt(quote.toAmountMin);
      expect(toAmountMin).toBeLessThan(toAmount);
    });

    test('should call contract methods with correct parameters', async () => {
      await service.getSwapQuote(swapParams);

      expect(mockContract.getAmountsOut).toHaveBeenCalledWith(
        swapParams.amount,
        [swapParams.fromToken, swapParams.toToken]
      );
    });

    test('should handle provider not found error', async () => {
      const invalidParams = { ...swapParams, chainId: 999 };

      await expect(service.getSwapQuote(invalidParams)).rejects.toThrow(
        'No provider for chain 999'
      );
    });

    test('should handle contract errors', async () => {
      mockContract.getAmountsOut.mockRejectedValue(new Error('Insufficient liquidity'));

      await expect(service.getSwapQuote(swapParams)).rejects.toThrow(
        'Insufficient liquidity'
      );
    });
  });

  describe('executeSwap', () => {
    const swapParams = {
      chainId: 8453,
      fromToken: '0xusdc123',
      toToken: '0xweth123',
      amount: '1000000000',
      slippage: 0.5,
      userAddress: '0xuser123',
    };

    test('should execute swap and return transaction hash', async () => {
      const txHash = await service.executeSwap(swapParams, mockSigner);

      expect(txHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockContract.swapExactTokensForTokens).toHaveBeenCalled();
    });

    test('should use quote data for transaction', async () => {
      await service.executeSwap(swapParams, mockSigner);

      const callArgs = mockContract.swapExactTokensForTokens.mock.calls[0];
      expect(callArgs[0]).toBe(swapParams.amount); // amount
      expect(callArgs[2]).toEqual([swapParams.fromToken, swapParams.toToken]); // path
      expect(callArgs[3]).toBe(swapParams.userAddress); // to
    });

    test('should handle transaction errors', async () => {
      mockContract.swapExactTokensForTokens.mockRejectedValue(
        new Error('Transaction failed')
      );

      await expect(service.executeSwap(swapParams, mockSigner)).rejects.toThrow(
        'Transaction failed'
      );
    });
  });

  describe('addLiquidity', () => {
    const liquidityParams = {
      chainId: 8453,
      tokenA: '0xusdc123',
      tokenB: '0xweth123',
      amountADesired: '1000000000',
      amountBDesired: '1000000000000000000',
      amountAMin: '950000000',
      amountBMin: '950000000000000000',
      userAddress: '0xuser123',
    };

    test('should add liquidity and return transaction hash', async () => {
      const txHash = await service.addLiquidity(liquidityParams, mockSigner);

      expect(txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(mockContract.addLiquidity).toHaveBeenCalledWith(
        liquidityParams.tokenA,
        liquidityParams.tokenB,
        liquidityParams.amountADesired,
        liquidityParams.amountBDesired,
        liquidityParams.amountAMin,
        liquidityParams.amountBMin,
        liquidityParams.userAddress,
        expect.any(Number) // deadline
      );
    });

    test('should use custom deadline when provided', async () => {
      const customDeadline = Math.floor(Date.now() / 1000) + 3600;
      const paramsWithDeadline = { ...liquidityParams, deadline: customDeadline };

      await service.addLiquidity(paramsWithDeadline, mockSigner);

      const callArgs = mockContract.addLiquidity.mock.calls[0];
      expect(callArgs[7]).toBe(customDeadline);
    });
  });

  describe('getPoolInfo', () => {
    test('should return pool information', async () => {
      const poolInfo = await service.getPoolInfo(8453, '0xusdc123', '0xweth123');

      expect(poolInfo).toMatchObject({
        chainId: 8453,
        address: '0x1234567890abcdef1234567890abcdef12345678',
        token0: '0xusdc123',
        token1: '0xweth123',
        reserve0: '5000000000000',
        reserve1: '1750000000000000000',
        totalSupply: '2915475906000000',
        fee: 0.0017,
      });
    });

    test('should handle non-existent pool', async () => {
      mockContract.getPair.mockResolvedValue('0x0000000000000000000000000000000000000000');

      await expect(service.getPoolInfo(8453, '0xtoken1', '0xtoken2')).rejects.toThrow(
        'Pool does not exist'
      );
    });

    test('should call factory and pair contracts correctly', async () => {
      await service.getPoolInfo(8453, '0xusdc123', '0xweth123');

      expect(mockContract.getPair).toHaveBeenCalledWith('0xusdc123', '0xweth123');
      expect(mockContract.getReserves).toHaveBeenCalled();
      expect(mockContract.totalSupply).toHaveBeenCalled();
    });
  });

  describe('compareChainPrices', () => {
    test('should compare prices across all chains', async () => {
      // Mock different chain configs
      const baseConfig = { ...testConfig, chainId: 8453 };
      const pulseConfig = { ...testConfig, chainId: 369, name: 'PulseChain' };
      const sonicConfig = { ...testConfig, chainId: 146, name: 'Sonic' };

      (getAllSupported9MMChains as jest.Mock).mockReturnValue([
        baseConfig,
        pulseConfig,
        sonicConfig,
      ]);

      // Mock different prices for each chain
      mockContract.getAmountsOut
        .mockResolvedValueOnce(['1000000000', '2000000000000000000']) // Base
        .mockResolvedValueOnce(['1000000000', '1900000000000000000']) // PulseChain
        .mockResolvedValueOnce(['1000000000', '1950000000000000000']); // Sonic

      const quotes = await service.compareChainPrices('USDC', 'WETH', '1000000000');

      expect(quotes).toHaveLength(3);
      expect(quotes[0].toAmount).toBe('2000000000000000000'); // Best price first
      expect(quotes[1].toAmount).toBe('1950000000000000000');
      expect(quotes[2].toAmount).toBe('1900000000000000000');
    });

    test('should handle failures gracefully', async () => {
      mockContract.getAmountsOut
        .mockResolvedValueOnce(['1000000000', '2000000000000000000'])
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(['1000000000', '1950000000000000000']);

      const quotes = await service.compareChainPrices('USDC', 'WETH', '1000000000');

      // Should return 2 successful quotes, ignoring the failed one
      expect(quotes).toHaveLength(2);
    });
  });

  describe('getBestChainForPair', () => {
    test('should return best chain quote', async () => {
      mockContract.getAmountsOut.mockResolvedValue(['1000000000', '2000000000000000000']);

      const bestQuote = await service.getBestChainForPair('USDC', 'WETH', '1000000000');

      expect(bestQuote).not.toBeNull();
      expect(bestQuote?.chainId).toBe(8453);
      expect(bestQuote?.toAmount).toBe('2000000000000000000');
    });

    test('should return null when no quotes available', async () => {
      mockContract.getAmountsOut.mockRejectedValue(new Error('No liquidity'));

      const bestQuote = await service.getBestChainForPair('USDC', 'WETH', '1000000000');

      expect(bestQuote).toBeNull();
    });
  });

  describe('getUserBalances', () => {
    test('should return balances across all chains', async () => {
      // Mock token contract for balanceOf calls
      const mockTokenContract = {
        balanceOf: jest.fn().mockResolvedValue('100000000000000000000'),
      };
      (ethers.Contract as jest.Mock).mockReturnValue(mockTokenContract);

      const balances = await service.getUserBalances('0xuser123');

      expect(balances).toHaveProperty('8453');
      expect(balances[8453]).toHaveProperty('ETH');
      expect(mockProvider.getBalance).toHaveBeenCalledWith('0xuser123');
    });

    test('should handle balance fetching errors gracefully', async () => {
      mockProvider.getBalance.mockRejectedValue(new Error('Network error'));

      const balances = await service.getUserBalances('0xuser123');

      // Should return empty balances for failed chain
      expect(balances).toHaveProperty('8453');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid chain IDs', async () => {
      (get9MMConfig as jest.Mock).mockImplementation((chainId) => {
        if (chainId === 999) throw new Error('9MM not deployed on chain 999');
        return testConfig;
      });

      await expect(service.getSwapQuote({
        chainId: 999,
        fromToken: '0xusdc123',
        toToken: '0xweth123',
        amount: '1000000000',
        slippage: 0.5,
        userAddress: '0xuser123',
      })).rejects.toThrow('9MM not deployed on chain 999');
    });

    test('should handle contract call failures', async () => {
      mockContract.getAmountsOut.mockRejectedValue(new Error('Contract call failed'));

      await expect(service.getSwapQuote({
        chainId: 8453,
        fromToken: '0xusdc123',
        toToken: '0xweth123',
        amount: '1000000000',
        slippage: 0.5,
        userAddress: '0xuser123',
      })).rejects.toThrow('Contract call failed');
    });
  });

  describe('Gas Estimation', () => {
    test('should estimate gas for transactions', async () => {
      const quote = await service.getSwapQuote({
        chainId: 8453,
        fromToken: '0xusdc123',
        toToken: '0xweth123',
        amount: '1000000000',
        slippage: 0.5,
        userAddress: '0xuser123',
      });

      expect(quote.gasEstimate).toBe('180000');
      expect(mockContract.getFunction).toHaveBeenCalledWith('swapExactTokensForTokens');
    });
  });

  describe('Price Impact Calculation', () => {
    test('should calculate price impact', async () => {
      const quote = await service.getSwapQuote({
        chainId: 8453,
        fromToken: '0xusdc123',
        toToken: '0xweth123',
        amount: '1000000000',
        slippage: 0.5,
        userAddress: '0xuser123',
      });

      expect(typeof quote.priceImpact).toBe('number');
      expect(quote.priceImpact).toBeGreaterThanOrEqual(0);
    });
  });
}); 