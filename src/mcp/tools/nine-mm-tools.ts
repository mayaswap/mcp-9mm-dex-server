/**
 * 9MM MCP Tools
 * AI-accessible tools for 9MM DEX operations across Base, PulseChain, and Sonic
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { nineMMService } from '../../services/nine-mm-service.js';
import { get9MMConfig, getAllSupported9MMChains, COMMON_TOKENS } from '../../config/9mm-config.js';
import { logger } from '../../utils/logger.js';

// Import wallet tools
import { walletTools, handleWalletTool } from './wallet-tools.js';

export const nineMMTools: Tool[] = [
  {
    name: 'get_9mm_swap_quote',
    description: 'Get a swap quote from 9MM DEX on any supported chain (Base, PulseChain, Sonic)',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Chain ID (8453=Base, 369=PulseChain, 146=Sonic)',
          enum: [8453, 369, 146],
        },
        fromToken: {
          type: 'string',
          description: 'Address of token to sell (or symbol like USDC, WETH)',
        },
        toToken: {
          type: 'string',
          description: 'Address of token to buy (or symbol like USDC, WETH)',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap (in wei or token decimals)',
        },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance (0.5 = 0.5%)',
          default: 0.5,
        },
        userAddress: {
          type: 'string',
          description: 'User wallet address',
        },
      },
      required: ['chainId', 'fromToken', 'toToken', 'amount', 'userAddress'],
    },
  },

  {
    name: 'compare_9mm_prices',
    description: 'Compare swap prices across all 9MM chains to find the best rate',
    inputSchema: {
      type: 'object',
      properties: {
        fromToken: {
          type: 'string',
          description: 'Token to sell (symbol or address)',
        },
        toToken: {
          type: 'string',
          description: 'Token to buy (symbol or address)',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap',
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
        chainId: {
          type: 'number',
          description: 'Chain ID (8453=Base, 369=PulseChain, 146=Sonic)',
          enum: [8453, 369, 146],
        },
        tokenA: {
          type: 'string',
          description: 'First token address',
        },
        tokenB: {
          type: 'string',
          description: 'Second token address',
        },
      },
      required: ['chainId', 'tokenA', 'tokenB'],
    },
  },

  {
    name: 'get_9mm_user_balances',
    description: 'Get user token balances across all 9MM supported chains',
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
    name: 'get_9mm_supported_chains',
    description: 'Get list of all chains where 9MM is deployed',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'get_9mm_common_tokens',
    description: 'Get list of common tokens on each 9MM chain',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Chain ID (optional, returns all if not specified)',
          enum: [8453, 369, 146],
        },
      },
    },
  },

  {
    name: 'prepare_9mm_swap_transaction',
    description: 'Prepare a swap transaction for signing (does not execute)',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Chain ID (8453=Base, 369=PulseChain, 146=Sonic)',
          enum: [8453, 369, 146],
        },
        fromToken: {
          type: 'string',
          description: 'Address of token to sell',
        },
        toToken: {
          type: 'string',
          description: 'Address of token to buy',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap (in wei)',
        },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance (0.5 = 0.5%)',
          default: 0.5,
        },
        userAddress: {
          type: 'string',
          description: 'User wallet address',
        },
      },
      required: ['chainId', 'fromToken', 'toToken', 'amount', 'userAddress'],
    },
  },

  {
    name: 'get_9mm_best_chain',
    description: 'Find the best 9MM chain for a specific trading pair',
    inputSchema: {
      type: 'object',
      properties: {
        fromToken: {
          type: 'string',
          description: 'Token to sell (symbol or address)',
        },
        toToken: {
          type: 'string',
          description: 'Token to buy (symbol or address)',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap',
        },
      },
      required: ['fromToken', 'toToken', 'amount'],
    },
  },
];

// Combined tools export
export const allTools: Tool[] = [...nineMMTools, ...walletTools];

// Combined tool handler
export const handleAllTools = async (name: string, args: any): Promise<any> => {
  // Check if it's a wallet tool
  if (walletTools.some(tool => tool.name === name)) {
    return await handleWalletTool(name, args);
  }
  
  // Otherwise, handle as 9MM tool
  return await handle9MMTool(name, args);
};

// Tool handlers
export const handle9MMTool = async (name: string, args: any): Promise<any> => {
  try {
    switch (name) {
      case 'get_9mm_swap_quote':
        return await handleGetSwapQuote(args);
      
      case 'compare_9mm_prices':
        return await handleComparePrices(args);
      
      case 'get_9mm_pool_info':
        return await handleGetPoolInfo(args);
      
      case 'get_9mm_user_balances':
        return await handleGetUserBalances(args);
      
      case 'get_9mm_supported_chains':
        return await handleGetSupportedChains();
      
      case 'get_9mm_common_tokens':
        return await handleGetCommonTokens(args);
      
      case 'prepare_9mm_swap_transaction':
        return await handlePrepareSwapTransaction(args);
      
      case 'get_9mm_best_chain':
        return await handleGetBestChain(args);
      
      default:
        throw new Error(`Unknown 9MM tool: ${name}`);
    }
  } catch (error) {
    logger.error(`9MM tool error (${name}):`, error);
    throw error;
  }
};

// Individual tool handlers

async function handleGetSwapQuote(args: any) {
  const { chainId, fromToken, toToken, amount, slippage = 0.5, userAddress } = args;
  
  // Resolve token symbols to addresses if needed
  const resolvedFromToken = resolveTokenAddress(fromToken, chainId);
  const resolvedToToken = resolveTokenAddress(toToken, chainId);
  
  const quote = await nineMMService.getSwapQuote({
    chainId,
    fromToken: resolvedFromToken,
    toToken: resolvedToToken,
    amount,
    slippage,
    userAddress,
  });

  const config = get9MMConfig(chainId);
  
  return {
    success: true,
    data: {
      ...quote,
      chainName: config.name,
      nativeCurrency: config.nativeCurrency,
      estimatedGasCost: calculateGasCost(quote.gasEstimate, config),
    },
  };
}

async function handleComparePrices(args: any) {
  const { fromToken, toToken, amount } = args;
  
  const quotes = await nineMMService.compareChainPrices(fromToken, toToken, amount);
  
  return {
    success: true,
    data: {
      quotes,
      bestChain: quotes[0]?.chainId || null,
      priceComparison: quotes.map(quote => ({
        chainId: quote.chainId,
        chainName: get9MMConfig(quote.chainId).name,
        outputAmount: quote.toAmount,
        priceImpact: quote.priceImpact,
        gasEstimate: quote.gasEstimate,
      })),
    },
  };
}

async function handleGetPoolInfo(args: any) {
  const { chainId, tokenA, tokenB } = args;
  
  const poolInfo = await nineMMService.getPoolInfo(chainId, tokenA, tokenB);
  
  return {
    success: true,
    data: {
      ...poolInfo,
      chainName: get9MMConfig(chainId).name,
    },
  };
}

async function handleGetUserBalances(args: any) {
  const { userAddress } = args;
  
  const balances = await nineMMService.getUserBalances(userAddress);
  
  // Add chain names to the response
  const enrichedBalances = Object.entries(balances).reduce((acc, [chainId, tokens]) => {
    const config = get9MMConfig(Number(chainId));
    acc[chainId] = {
      chainName: config.name,
      nativeCurrency: config.nativeCurrency,
      tokens,
    };
    return acc;
  }, {} as any);
  
  return {
    success: true,
    data: enrichedBalances,
  };
}

async function handleGetSupportedChains() {
  const chains = getAllSupported9MMChains();
  
  return {
    success: true,
    data: {
      chains: chains.map(chain => ({
        chainId: chain.chainId,
        name: chain.name,
        nativeCurrency: chain.nativeCurrency,
        blockExplorer: chain.blockExplorer,
        features: chain.features,
      })),
      totalChains: chains.length,
    },
  };
}

async function handleGetCommonTokens(args: any) {
  const { chainId } = args;
  
  if (chainId) {
    const tokens = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS];
    const config = get9MMConfig(chainId);
    
    return {
      success: true,
      data: {
        chainId,
        chainName: config.name,
        tokens: tokens || {},
      },
    };
  }
  
  // Return all chains' tokens
  const allTokens = Object.entries(COMMON_TOKENS).map(([chainId, tokens]) => {
    const config = get9MMConfig(Number(chainId));
    return {
      chainId: Number(chainId),
      chainName: config.name,
      tokens,
    };
  });
  
  return {
    success: true,
    data: {
      chains: allTokens,
    },
  };
}

async function handlePrepareSwapTransaction(args: any) {
  const { chainId, fromToken, toToken, amount, slippage = 0.5, userAddress } = args;
  
  // Get quote first
  const quote = await nineMMService.getSwapQuote({
    chainId,
    fromToken,
    toToken,
    amount,
    slippage,
    userAddress,
  });
  
  const config = get9MMConfig(chainId);
  
  // Prepare transaction data (this would be used with MetaMask or WalletConnect)
  const transactionData = {
    to: config.contracts.v3.router, // Use V3 router for smart routing
    data: '0x', // Would encode the actual swap function call
    value: '0', // For ETH swaps, this would be the amount
    gasLimit: quote.gasEstimate,
    gasPrice: config.gasSettings.gasPrice,
  };
  
  return {
    success: true,
    data: {
      quote,
      transaction: transactionData,
      chainName: config.name,
      instructions: [
        'This transaction data can be used with MetaMask or WalletConnect',
        'Make sure to approve token spending before executing the swap',
        'Double-check the amounts and slippage before signing',
      ],
    },
  };
}

async function handleGetBestChain(args: any) {
  const { fromToken, toToken, amount } = args;
  
  const bestQuote = await nineMMService.getBestChainForPair(fromToken, toToken, amount);
  
  if (!bestQuote) {
    return {
      success: false,
      error: 'No available quotes for this trading pair',
    };
  }
  
  const config = get9MMConfig(bestQuote.chainId);
  
  return {
    success: true,
    data: {
      bestChain: {
        chainId: bestQuote.chainId,
        name: config.name,
        nativeCurrency: config.nativeCurrency,
      },
      quote: bestQuote,
      reasons: [
        `Best output amount: ${bestQuote.toAmount}`,
        `Low fees: ${(bestQuote.fee * 100).toFixed(2)}%`,
        `Price impact: ${bestQuote.priceImpact.toFixed(2)}%`,
      ],
    },
  };
}

// Helper functions

function resolveTokenAddress(tokenInput: string, chainId: number): string {
  // If it's already an address (starts with 0x), return as-is
  if (tokenInput.startsWith('0x')) {
    return tokenInput;
  }
  
  // Try to resolve from common tokens
  const tokens = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS];
  if (tokens && tokens[tokenInput as keyof typeof tokens]) {
    return tokens[tokenInput as keyof typeof tokens];
  }
  
  // If not found, return as-is (might be a symbol not in our list)
  return tokenInput;
}

function calculateGasCost(gasEstimate: string, config: any): string {
  const gasPrice = BigInt(config.gasSettings.gasPrice) * 1_000_000_000n; // Convert gwei to wei
  const gasCost = BigInt(gasEstimate) * gasPrice;
  return gasCost.toString();
} 