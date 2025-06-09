/**
 * Tests for 9MM MCP Tools
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock the service before importing tools
jest.mock('../../src/services/nine-mm-service', () => ({
  nineMMService: {
    getSwapQuote: jest.fn(),
    compareChainPrices: jest.fn(),
    getPoolInfo: jest.fn(),
    getUserBalances: jest.fn(),
    getBestChainForPair: jest.fn(),
  },
}));

jest.mock('../../src/config/9mm-config', () => ({
  get9MMConfig: jest.fn(),
  getAllSupported9MMChains: jest.fn(),
  COMMON_TOKENS: {
    8453: { USDC: '0xusdc', WETH: '0xweth', '9MM': '0x9mm' },
    369: { WPLS: '0xwpls', '9MM': '0x9mm' },
    146: { WS: '0xws', '9MM': '0x9mm' },
  },
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

import { nineMMTools, handle9MMTool } from '../../src/mcp/tools/nine-mm-tools';
import { nineMMService } from '../../src/services/nine-mm-service';
import { get9MMConfig, getAllSupported9MMChains } from '../../src/config/9mm-config';

describe('9MM MCP Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock returns
    (get9MMConfig as jest.Mock).mockReturnValue({
      chainId: 8453,
      name: 'Base',
      nativeCurrency: 'ETH',
      gasSettings: { gasPrice: '0.1' },
    });

    (getAllSupported9MMChains as jest.Mock).mockReturnValue([
      { chainId: 8453, name: 'Base', nativeCurrency: 'ETH' },
      { chainId: 369, name: 'PulseChain', nativeCurrency: 'PLS' },
      { chainId: 146, name: 'Sonic', nativeCurrency: 'S' },
    ]);
  });

  describe('Tool Definitions', () => {
    test('should export correct number of tools', () => {
      expect(nineMMTools).toHaveLength(8);
    });

    test('should have all required tools', () => {
      const toolNames = nineMMTools.map(tool => tool.name);
      const expectedTools = [
        'get_9mm_swap_quote',
        'compare_9mm_prices',
        'get_9mm_pool_info',
        'get_9mm_user_balances',
        'get_9mm_supported_chains',
        'get_9mm_common_tokens',
        'prepare_9mm_swap_transaction',
        'get_9mm_best_chain',
      ];

      expectedTools.forEach(toolName => {
        expect(toolNames).toContain(toolName);
      });
    });

    test('should have proper tool schemas', () => {
      nineMMTools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
      });
    });

    test('get_9mm_swap_quote should have correct schema', () => {
      const swapTool = nineMMTools.find(t => t.name === 'get_9mm_swap_quote');
      expect(swapTool).toBeDefined();
      
      const schema = swapTool!.inputSchema;
      expect(schema.properties).toHaveProperty('chainId');
      expect(schema.properties).toHaveProperty('fromToken');
      expect(schema.properties).toHaveProperty('toToken');
      expect(schema.properties).toHaveProperty('amount');
      expect(schema.properties).toHaveProperty('userAddress');
      expect(schema.required).toEqual(['chainId', 'fromToken', 'toToken', 'amount', 'userAddress']);
    });
  });

  describe('Tool Handler - get_9mm_swap_quote', () => {
    const mockQuote = {
      chainId: 8453,
      fromToken: '0xusdc',
      toToken: '0xweth',
      fromAmount: '1000000000',
      toAmount: '2000000000000000000',
      toAmountMin: '1990000000000000000',
      priceImpact: 0.1,
      fee: 0.0017,
      gasEstimate: '180000',
      route: ['0xusdc', '0xweth'],
      validUntil: Date.now() + 30000,
    };

    beforeEach(() => {
      (nineMMService.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);
    });

    test('should handle valid swap quote request', async () => {
      const args = {
        chainId: 8453,
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
        slippage: 0.5,
        userAddress: '0xuser123',
      };

      const result = await handle9MMTool('get_9mm_swap_quote', args);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        chainId: 8453,
        chainName: 'Base',
        nativeCurrency: 'ETH',
      });
      expect(nineMMService.getSwapQuote).toHaveBeenCalledWith({
        chainId: 8453,
        fromToken: '0xusdc', // Resolved from symbol
        toToken: '0xweth',   // Resolved from symbol
        amount: '1000000000',
        slippage: 0.5,
        userAddress: '0xuser123',
      });
    });

    test('should resolve token symbols to addresses', async () => {
      const args = {
        chainId: 8453,
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
        userAddress: '0xuser123',
      };

      await handle9MMTool('get_9mm_swap_quote', args);

      const callArgs = (nineMMService.getSwapQuote as jest.Mock).mock.calls[0][0];
      expect(callArgs.fromToken).toBe('0xusdc');
      expect(callArgs.toToken).toBe('0xweth');
    });

    test('should pass through addresses directly', async () => {
      const args = {
        chainId: 8453,
        fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        toToken: '0x4200000000000000000000000000000000000006',
        amount: '1000000000',
        userAddress: '0xuser123',
      };

      await handle9MMTool('get_9mm_swap_quote', args);

      const callArgs = (nineMMService.getSwapQuote as jest.Mock).mock.calls[0][0];
      expect(callArgs.fromToken).toBe('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913');
      expect(callArgs.toToken).toBe('0x4200000000000000000000000000000000000006');
    });

    test('should calculate gas cost', async () => {
      const result = await handle9MMTool('get_9mm_swap_quote', {
        chainId: 8453,
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
        userAddress: '0xuser123',
      });

      expect(result.data).toHaveProperty('estimatedGasCost');
      expect(typeof result.data.estimatedGasCost).toBe('string');
    });
  });

  describe('Tool Handler - compare_9mm_prices', () => {
    const mockQuotes = [
      { chainId: 8453, toAmount: '2000000000000000000', priceImpact: 0.1 },
      { chainId: 369, toAmount: '1950000000000000000', priceImpact: 0.15 },
      { chainId: 146, toAmount: '1975000000000000000', priceImpact: 0.12 },
    ];

    beforeEach(() => {
      (nineMMService.compareChainPrices as jest.Mock).mockResolvedValue(mockQuotes);
    });

    test('should compare prices across chains', async () => {
      const args = {
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
      };

      const result = await handle9MMTool('compare_9mm_prices', args);

      expect(result.success).toBe(true);
      expect(result.data.quotes).toHaveLength(3);
      expect(result.data.bestChain).toBe(8453);
      expect(result.data.priceComparison).toHaveLength(3);
      expect(nineMMService.compareChainPrices).toHaveBeenCalledWith('USDC', 'WETH', '1000000000');
    });

    test('should include chain names in comparison', async () => {
      const result = await handle9MMTool('compare_9mm_prices', {
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
      });

      const comparison = result.data.priceComparison;
      expect(comparison[0]).toHaveProperty('chainName', 'Base');
      expect(comparison[1]).toHaveProperty('chainName', 'PulseChain');
      expect(comparison[2]).toHaveProperty('chainName', 'Sonic');
    });
  });

  describe('Tool Handler - get_9mm_pool_info', () => {
    const mockPoolInfo = {
      chainId: 8453,
      address: '0xpool123',
      token0: '0xusdc',
      token1: '0xweth',
      reserve0: '5000000000000',
      reserve1: '1750000000000000000',
      totalSupply: '2915475906000000',
      fee: 0.0017,
    };

    beforeEach(() => {
      (nineMMService.getPoolInfo as jest.Mock).mockResolvedValue(mockPoolInfo);
    });

    test('should get pool information', async () => {
      const args = {
        chainId: 8453,
        tokenA: '0xusdc',
        tokenB: '0xweth',
      };

      const result = await handle9MMTool('get_9mm_pool_info', args);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        chainId: 8453,
        chainName: 'Base',
        address: '0xpool123',
      });
      expect(nineMMService.getPoolInfo).toHaveBeenCalledWith(8453, '0xusdc', '0xweth');
    });
  });

  describe('Tool Handler - get_9mm_user_balances', () => {
    const mockBalances = {
      8453: {
        ETH: '1500000000000000000',
        USDC: '2500000000',
        '9MM': '100000000000000000000',
      },
      369: {
        PLS: '5000000000000000000000',
        '9MM': '250000000000000000000',
      },
    };

    beforeEach(() => {
      (nineMMService.getUserBalances as jest.Mock).mockResolvedValue(mockBalances);
    });

    test('should get user balances across chains', async () => {
      const args = { userAddress: '0xuser123' };

      const result = await handle9MMTool('get_9mm_user_balances', args);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('8453');
      expect(result.data['8453']).toHaveProperty('chainName', 'Base');
      expect(result.data['8453']).toHaveProperty('tokens');
      expect(nineMMService.getUserBalances).toHaveBeenCalledWith('0xuser123');
    });
  });

  describe('Tool Handler - get_9mm_supported_chains', () => {
    test('should return supported chains information', async () => {
      const result = await handle9MMTool('get_9mm_supported_chains', {});

      expect(result.success).toBe(true);
      expect(result.data.chains).toHaveLength(3);
      expect(result.data.totalChains).toBe(3);
      
      const chainIds = result.data.chains.map((chain: any) => chain.chainId);
      expect(chainIds).toEqual([8453, 369, 146]);
    });
  });

  describe('Tool Handler - get_9mm_common_tokens', () => {
    test('should return tokens for specific chain', async () => {
      const args = { chainId: 8453 };

      const result = await handle9MMTool('get_9mm_common_tokens', args);

      expect(result.success).toBe(true);
      expect(result.data.chainId).toBe(8453);
      expect(result.data.chainName).toBe('Base');
      expect(result.data.tokens).toHaveProperty('USDC');
      expect(result.data.tokens).toHaveProperty('WETH');
    });

    test('should return tokens for all chains when no chainId provided', async () => {
      const result = await handle9MMTool('get_9mm_common_tokens', {});

      expect(result.success).toBe(true);
      expect(result.data.chains).toHaveLength(3);
      
      const chainNames = result.data.chains.map((chain: any) => chain.chainName);
      expect(chainNames).toEqual(['Base', 'PulseChain', 'Sonic']);
    });
  });

  describe('Tool Handler - prepare_9mm_swap_transaction', () => {
    const mockQuote = {
      chainId: 8453,
      gasEstimate: '180000',
      toAmountMin: '1990000000000000000',
    };

    beforeEach(() => {
      (nineMMService.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);
    });

    test('should prepare transaction data', async () => {
      const args = {
        chainId: 8453,
        fromToken: '0xusdc',
        toToken: '0xweth',
        amount: '1000000000',
        userAddress: '0xuser123',
      };

      const result = await handle9MMTool('prepare_9mm_swap_transaction', args);

      expect(result.success).toBe(true);
      expect(result.data.quote).toBeDefined();
      expect(result.data.transaction).toMatchObject({
        gasLimit: '180000',
        gasPrice: '0.1',
      });
      expect(result.data.instructions).toBeInstanceOf(Array);
    });
  });

  describe('Tool Handler - get_9mm_best_chain', () => {
    const mockBestQuote = {
      chainId: 8453,
      toAmount: '2000000000000000000',
      priceImpact: 0.1,
      fee: 0.0017,
    };

    beforeEach(() => {
      (nineMMService.getBestChainForPair as jest.Mock).mockResolvedValue(mockBestQuote);
    });

    test('should return best chain recommendation', async () => {
      const args = {
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
      };

      const result = await handle9MMTool('get_9mm_best_chain', args);

      expect(result.success).toBe(true);
      expect(result.data.bestChain).toMatchObject({
        chainId: 8453,
        name: 'Base',
        nativeCurrency: 'ETH',
      });
      expect(result.data.quote).toBeDefined();
      expect(result.data.reasons).toBeInstanceOf(Array);
    });

    test('should handle no available quotes', async () => {
      (nineMMService.getBestChainForPair as jest.Mock).mockResolvedValue(null);

      const result = await handle9MMTool('get_9mm_best_chain', {
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No available quotes for this trading pair');
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown tool names', async () => {
      await expect(handle9MMTool('unknown_tool', {})).rejects.toThrow(
        'Unknown 9MM tool: unknown_tool'
      );
    });

    test('should handle service errors gracefully', async () => {
      (nineMMService.getSwapQuote as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      await expect(handle9MMTool('get_9mm_swap_quote', {
        chainId: 8453,
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
        userAddress: '0xuser123',
      })).rejects.toThrow('Service error');
    });

    test('should handle config errors', async () => {
      (get9MMConfig as jest.Mock).mockImplementation(() => {
        throw new Error('Chain not supported');
      });

      await expect(handle9MMTool('get_9mm_swap_quote', {
        chainId: 999,
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
        userAddress: '0xuser123',
      })).rejects.toThrow('Chain not supported');
    });
  });

  describe('Token Resolution', () => {
    test('should resolve known token symbols', async () => {
      const args = {
        chainId: 8453,
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
        userAddress: '0xuser123',
      };

      await handle9MMTool('get_9mm_swap_quote', args);

      const callArgs = (nineMMService.getSwapQuote as jest.Mock).mock.calls[0][0];
      expect(callArgs.fromToken).toBe('0xusdc');
      expect(callArgs.toToken).toBe('0xweth');
    });

    test('should pass through unknown symbols unchanged', async () => {
      const args = {
        chainId: 8453,
        fromToken: 'UNKNOWN_TOKEN',
        toToken: 'WETH',
        amount: '1000000000',
        userAddress: '0xuser123',
      };

      await handle9MMTool('get_9mm_swap_quote', args);

      const callArgs = (nineMMService.getSwapQuote as jest.Mock).mock.calls[0][0];
      expect(callArgs.fromToken).toBe('UNKNOWN_TOKEN');
      expect(callArgs.toToken).toBe('0xweth');
    });

    test('should pass through addresses starting with 0x', async () => {
      const args = {
        chainId: 8453,
        fromToken: '0x123456789abcdef',
        toToken: '0xfedcba987654321',
        amount: '1000000000',
        userAddress: '0xuser123',
      };

      await handle9MMTool('get_9mm_swap_quote', args);

      const callArgs = (nineMMService.getSwapQuote as jest.Mock).mock.calls[0][0];
      expect(callArgs.fromToken).toBe('0x123456789abcdef');
      expect(callArgs.toToken).toBe('0xfedcba987654321');
    });
  });

  describe('Gas Cost Calculation', () => {
    test('should calculate gas cost correctly', async () => {
      const mockQuote = {
        gasEstimate: '180000',
      };
      (nineMMService.getSwapQuote as jest.Mock).mockResolvedValue(mockQuote);

      const result = await handle9MMTool('get_9mm_swap_quote', {
        chainId: 8453,
        fromToken: 'USDC',
        toToken: 'WETH',
        amount: '1000000000',
        userAddress: '0xuser123',
      });

      const expectedGasCost = (
        BigInt('180000') * BigInt('100000000') // 0.1 gwei in wei
      ).toString();

      expect(result.data.estimatedGasCost).toBe(expectedGasCost);
    });
  });
}); 