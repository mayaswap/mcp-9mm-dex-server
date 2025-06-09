/**
 * 9MM DEX MCP Tools
 * Tools for AI assistants to interact with 9MM DEX aggregator
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../utils/logger';
import { nineMMService } from '../../services/nine-mm-service';
import { nineMMPriceService } from '../../services/nine-mm-price-service';
import { DEXAggregatorService } from '../../services/dex-aggregator';
import { DEXProtocol } from '../../types/dex';
import axios from 'axios';

const dexAggregator = new DEXAggregatorService();

/**
 * Direct 9MM API quote helper function
 */
async function get9MMDirectQuote(params: {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
}) {
  try {
    // Get the correct base URL for each chain
    const baseUrls = {
      369: 'https://api.9mm.pro', // PulseChain
      8453: 'https://api-base.9mm.pro', // Base
      146: 'https://api-sonic.9mm.pro', // Sonic
    };

    const baseUrl = baseUrls[params.chainId as keyof typeof baseUrls];
    if (!baseUrl) {
      throw new Error(`9MM API not available for chain ${params.chainId}`);
    }

    // Convert token addresses for API call
    let sellToken = params.fromToken;
    let buyToken = params.toToken;

    // Handle native tokens
    if (params.chainId === 369 && params.fromToken.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      sellToken = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // PLS
    } else if (params.chainId === 8453 && params.fromToken.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      sellToken = 'ETH'; // ETH on Base
    } else if (params.chainId === 146 && params.fromToken.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      sellToken = 'S'; // S on Sonic
    }

    const url = `${baseUrl}/swap/v1/quote`;
    const queryParams = new URLSearchParams({
      buyToken,
      sellToken,
      sellAmount: params.amount,
      slippagePercentage: (params.slippage / 100).toString(), // Convert to decimal
      includedSources: '', // Empty as in examples
    });

    logger.info(`Getting 9MM direct quote from: ${url}?${queryParams.toString()}`);

    const response = await axios.get(`${url}?${queryParams.toString()}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'MCP-9MM-DEX-Server/1.0.0',
      },
    });

    if (!response.data) {
      throw new Error('Invalid response from 9MM API');
    }

    return {
      success: true,
      data: {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.amount,
        toAmount: response.data.buyAmount || '0',
        toAmountMin: response.data.buyAmount ? 
          (BigInt(response.data.buyAmount) * BigInt(Math.floor((100 - params.slippage) * 100)) / BigInt(10000)).toString() :
          '0',
        priceImpact: parseFloat(response.data.estimatedPriceImpact || '0'),
        slippage: params.slippage,
        gasEstimate: response.data.estimatedGas || '300000',
        gasPrice: response.data.gasPrice || '20000000000',
        sources: response.data.sources || [],
        validUntil: Date.now() + 30000,
        apiResponse: response.data,
      },
      metadata: {
        executionTime: Date.now(),
        timestamp: new Date().toISOString(),
        source: '9mm_direct_api',
        chainId: params.chainId,
      },
    };

  } catch (error) {
    logger.error('9MM direct API error:', error);
    return {
      success: false,
      error: {
        code: '9MM_DIRECT_API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown 9MM API error',
        details: params,
      },
      metadata: {
        executionTime: Date.now(),
        timestamp: new Date().toISOString(),
        source: '9mm_direct_api',
        chainId: params.chainId,
      },
    };
  }
}

export const nineMMDEXTools: Tool[] = [
  {
    name: 'get_9mm_token_price',
    description: 'Get token price from 9mm.pro price API for PulseChain, Base, or Sonic',
    inputSchema: {
      type: 'object',
      properties: {
        tokenAddress: {
          type: 'string',
          description: 'Token contract address',
        },
        chainId: {
          type: 'number',
          description: 'Chain ID (369 for PulseChain, 8453 for Base, 146 for Sonic)',
          enum: [369, 8453, 146],
        },
      },
      required: ['tokenAddress', 'chainId'],
    },
  },
  {
    name: 'get_9mm_swap_quote',
    description: 'Get swap quote from 9MM DEX for supported chains',
    inputSchema: {
      type: 'object',
      properties: {
        fromToken: {
          type: 'string',
          description: 'Source token address',
        },
        toToken: {
          type: 'string',
          description: 'Destination token address',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap (in token units)',
        },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance (e.g., 0.5 for 0.5%)',
          default: 0.5,
        },
        chainId: {
          type: 'number',
          description: 'Chain ID (369 for PulseChain, 8453 for Base, 146 for Sonic)',
          enum: [369, 8453, 146],
        },
        userAddress: {
          type: 'string',
          description: 'User wallet address',
        },
      },
      required: ['fromToken', 'toToken', 'amount', 'chainId', 'userAddress'],
    },
  },
  {
    name: 'get_best_dex_quote',
    description: 'Get best swap quote across all DEXs (prioritizes 9MM for supported chains)',
    inputSchema: {
      type: 'object',
      properties: {
        fromToken: {
          type: 'string',
          description: 'Source token address',
        },
        toToken: {
          type: 'string',
          description: 'Destination token address',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap (in token units)',
        },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance (e.g., 0.5 for 0.5%)',
          default: 0.5,
        },
        chainId: {
          type: 'number',
          description: 'Chain ID',
        },
        userAddress: {
          type: 'string',
          description: 'User wallet address',
        },
      },
      required: ['fromToken', 'toToken', 'amount', 'chainId', 'userAddress'],
    },
  },
  {
    name: 'compare_9mm_chain_prices',
    description: 'Compare token prices across all 9MM supported chains',
    inputSchema: {
      type: 'object',
      properties: {
        tokenSymbol: {
          type: 'string',
          description: 'Token symbol (e.g., WETH, USDC, 9MM)',
        },
      },
      required: ['tokenSymbol'],
    },
  },
  {
    name: 'get_best_chain_for_trading',
    description: 'Find the best chain for trading a specific token pair',
    inputSchema: {
      type: 'object',
      properties: {
        fromToken: {
          type: 'string',
          description: 'Source token address or symbol',
        },
        toToken: {
          type: 'string',
          description: 'Destination token address or symbol',
        },
        amount: {
          type: 'string',
          description: 'Amount to trade',
        },
      },
      required: ['fromToken', 'toToken', 'amount'],
    },
  },
  {
    name: 'get_9mm_pool_info',
    description: 'Get liquidity pool information from 9MM DEX',
    inputSchema: {
      type: 'object',
      properties: {
        tokenA: {
          type: 'string',
          description: 'First token address',
        },
        tokenB: {
          type: 'string',
          description: 'Second token address',
        },
        chainId: {
          type: 'number',
          description: 'Chain ID (369 for PulseChain, 8453 for Base, 146 for Sonic)',
          enum: [369, 8453, 146],
        },
      },
      required: ['tokenA', 'tokenB', 'chainId'],
    },
  },
  {
    name: 'get_user_9mm_balances',
    description: 'Get user token balances across all 9MM chains',
    inputSchema: {
      type: 'object',
      properties: {
        userAddress: {
          type: 'string',
          description: 'User wallet address',
        },
      },
      required: ['userAddress'],
    },
  },
  {
    name: 'test_9mm_apis',
    description: 'Test connectivity to all 9MM APIs (price and DEX)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'test_9mm_swap_api',
    description: 'Test the actual 9MM swap API with real quote',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Chain ID (369 for PulseChain, 8453 for Base, 146 for Sonic)',
          enum: [369, 8453, 146],
        },
        buyToken: {
          type: 'string',
          description: 'Token address to buy',
        },
        sellToken: {
          type: 'string',
          description: 'Token address to sell (or ETH/PLS/S for native tokens)',
        },
        sellAmount: {
          type: 'string',
          description: 'Amount to sell in token units',
        },
      },
      required: ['chainId', 'buyToken', 'sellToken', 'sellAmount'],
    },
  },
];

export async function handle9MMDEXTool(name: string, args: any): Promise<any> {
  try {
    logger.info(`Executing 9MM DEX tool: ${name}`, { args });

    switch (name) {
      case 'get_9mm_token_price':
        return await nineMMPriceService.getTokenPrice(args.tokenAddress, args.chainId);

      case 'get_9mm_swap_quote':
        // Use direct API call for real-time quotes
        return await get9MMDirectQuote({
          chainId: args.chainId,
          fromToken: args.fromToken,
          toToken: args.toToken,
          amount: args.amount,
          slippage: args.slippage || 0.5,
        });

      case 'get_best_dex_quote':
        const aggregatorParams = {
          fromToken: args.fromToken,
          toToken: args.toToken,
          amount: args.amount,
          slippage: args.slippage || 0.5,
          deadline: Math.floor(Date.now() / 1000) + 1200, // 20 minutes
          chainId: args.chainId,
          dexProtocol: DEXProtocol.NINE_MM, // Default preference
          userAddress: args.userAddress,
        };
        return await dexAggregator.getBestQuote(aggregatorParams);

      case 'compare_9mm_chain_prices':
        return await nineMMPriceService.getCrossChainPriceComparison(args.tokenSymbol);

      case 'get_best_chain_for_trading':
        // For token symbols, find best chain by price comparison
        if (args.fromToken.length <= 10 && args.toToken.length <= 10) {
          const fromChain = await nineMMPriceService.getBestChainForToken(args.fromToken);
          const toChain = await nineMMPriceService.getBestChainForToken(args.toToken);
          return {
            fromTokenBestChain: fromChain,
            toTokenBestChain: toChain,
          };
        }
        
        // For token addresses, compare quotes across chains
        const chainComparison = await Promise.all([
          nineMMService.getSwapQuote({
            chainId: 369,
            fromToken: args.fromToken,
            toToken: args.toToken,
            amount: args.amount,
            slippage: 0.5,
            userAddress: '0x0000000000000000000000000000000000000000',
          }).catch(() => null),
          nineMMService.getSwapQuote({
            chainId: 8453,
            fromToken: args.fromToken,
            toToken: args.toToken,
            amount: args.amount,
            slippage: 0.5,
            userAddress: '0x0000000000000000000000000000000000000000',
          }).catch(() => null),
          nineMMService.getSwapQuote({
            chainId: 146,
            fromToken: args.fromToken,
            toToken: args.toToken,
            amount: args.amount,
            slippage: 0.5,
            userAddress: '0x0000000000000000000000000000000000000000',
          }).catch(() => null),
        ]);

        const validQuotes = chainComparison.filter(q => q !== null);
        if (validQuotes.length === 0) {
          throw new Error('No valid quotes found on any chain');
        }

        const bestChainQuote = validQuotes.reduce((best, current) => 
          parseFloat(current!.toAmount) > parseFloat(best!.toAmount) ? current : best
        );

        return {
          bestChain: bestChainQuote!.chainId,
          bestQuote: bestChainQuote,
          allQuotes: validQuotes,
        };

      case 'get_9mm_pool_info':
        return await nineMMService.getPoolInfo(args.chainId, args.tokenA, args.tokenB);

      case 'get_user_9mm_balances':
        return await nineMMService.getUserBalances(args.userAddress);

      case 'test_9mm_apis':
        const priceTests = await nineMMPriceService.testAllEndpoints();
        const dexTests = await Promise.all([369, 8453, 146].map(async (chainId) => {
          try {
            await nineMMService.getSwapQuote({
              chainId,
              fromToken: '0x0000000000000000000000000000000000000000',
              toToken: '0x0000000000000000000000000000000000000001',
              amount: '1000000000000000000',
              slippage: 0.5,
              userAddress: '0x0000000000000000000000000000000000000000',
            });
            return { chainId, status: true };
          } catch {
            return { chainId, status: false };
          }
        }));

        return {
          priceAPI: priceTests,
          dexAPI: dexTests.reduce((acc, test) => {
            acc[test.chainId] = test.status;
            return acc;
          }, {} as Record<number, boolean>),
          summary: {
            priceAPIsWorking: Object.values(priceTests).filter(Boolean).length,
            dexAPIsWorking: dexTests.filter(t => t.status).length,
            totalEndpoints: Object.keys(priceTests).length + dexTests.length,
          },
        };

      case 'test_9mm_swap_api':
        return await get9MMDirectQuote({
          chainId: args.chainId,
          fromToken: args.sellToken,
          toToken: args.buyToken,
          amount: args.sellAmount,
          slippage: 0.5, // Default 0.5%
        });

      default:
        throw new Error(`Unknown 9MM DEX tool: ${name}`);
    }
  } catch (error) {
    logger.error(`9MM DEX tool error for ${name}:`, error);
    throw error;
  }
} 