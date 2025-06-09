/**
 * Wallet MCP Tools
 * AI-accessible tools for wallet management and transaction execution
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { walletService } from '../../services/wallet-service.js';
import { get9MMConfig } from '../../config/9mm-config.js';
import { logger } from '../../utils/logger.js';

export const walletTools: Tool[] = [
  // DEPRECATED: External wallet connections removed for security
  // Use 'create_new_wallet' from user-wallet-tools instead
  {
    name: 'connect_wallet_deprecated',
    description: '⚠️ DEPRECATED: External wallet connections disabled. Use create_new_wallet instead for auto-generated wallets.',
    inputSchema: {
      type: 'object',
      properties: {
        deprecation_notice: {
          type: 'string',
          description: 'This tool is deprecated. Use create_new_wallet for secure auto-generated wallets.',
        },
      },
    },
  },

  // DEPRECATED: Use create_new_wallet instead
  {
    name: 'generate_wallet_deprecated',
    description: '⚠️ DEPRECATED: Use create_new_wallet instead for improved security and user management.',
    inputSchema: {
      type: 'object',
      properties: {
        deprecation_notice: {
          type: 'string',
          description: 'This tool is deprecated. Use create_new_wallet for secure auto-generated wallets.',
        },
      },
    },
  },

  {
    name: 'get_wallet_info',
    description: 'Get connected wallet information and balances',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'execute_swap',
    description: 'Execute a token swap transaction on 9MM DEX',
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
          description: 'Token to sell (address or symbol like USDC, WETH)',
        },
        toToken: {
          type: 'string',
          description: 'Token to buy (address or symbol like USDC, WETH)',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap (in wei or token decimals)',
        },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance (0.5 = 0.5%)',
          default: 0.5,
          minimum: 0.1,
          maximum: 10,
        },
        deadline: {
          type: 'number',
          description: 'Transaction deadline (Unix timestamp, optional)',
        },
      },
      required: ['chainId', 'fromToken', 'toToken', 'amount'],
    },
  },

  {
    name: 'approve_token',
    description: 'Approve token spending for DEX operations',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Chain ID (8453=Base, 369=PulseChain, 146=Sonic)',
          enum: [8453, 369, 146],
        },
        tokenAddress: {
          type: 'string',
          description: 'Token contract address to approve',
        },
        amount: {
          type: 'string',
          description: 'Amount to approve (default: unlimited)',
        },
      },
      required: ['chainId', 'tokenAddress'],
    },
  },

  {
    name: 'add_liquidity',
    description: 'Add liquidity to a 9MM DEX pool',
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
        amountADesired: {
          type: 'string',
          description: 'Desired amount of token A',
        },
        amountBDesired: {
          type: 'string',
          description: 'Desired amount of token B',
        },
        amountAMin: {
          type: 'string',
          description: 'Minimum amount of token A',
        },
        amountBMin: {
          type: 'string',
          description: 'Minimum amount of token B',
        },
        deadline: {
          type: 'number',
          description: 'Transaction deadline (Unix timestamp, optional)',
        },
      },
      required: ['chainId', 'tokenA', 'tokenB', 'amountADesired', 'amountBDesired', 'amountAMin', 'amountBMin'],
    },
  },

  {
    name: 'remove_liquidity',
    description: 'Remove liquidity from a 9MM DEX pool',
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
        liquidity: {
          type: 'string',
          description: 'Amount of LP tokens to remove',
        },
        amountAMin: {
          type: 'string',
          description: 'Minimum amount of token A to receive',
        },
        amountBMin: {
          type: 'string',
          description: 'Minimum amount of token B to receive',
        },
        deadline: {
          type: 'number',
          description: 'Transaction deadline (Unix timestamp, optional)',
        },
      },
      required: ['chainId', 'tokenA', 'tokenB', 'liquidity', 'amountAMin', 'amountBMin'],
    },
  },

  {
    name: 'check_token_allowance',
    description: 'Check token spending allowance for DEX contracts',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Chain ID (8453=Base, 369=PulseChain, 146=Sonic)',
          enum: [8453, 369, 146],
        },
        tokenAddress: {
          type: 'string',
          description: 'Token contract address',
        },
        ownerAddress: {
          type: 'string',
          description: 'Token owner address (default: connected wallet)',
        },
      },
      required: ['chainId', 'tokenAddress'],
    },
  },

  {
    name: 'disconnect_wallet',
    description: 'Disconnect wallet from specific chain or all chains',
    inputSchema: {
      type: 'object',
      properties: {
        chainId: {
          type: 'number',
          description: 'Chain ID to disconnect from (optional, disconnects from all if not specified)',
          enum: [8453, 369, 146],
        },
      },
    },
  },
];

// Tool handlers
export const handleWalletTool = async (name: string, args: any): Promise<any> => {
  try {
    switch (name) {
      case 'connect_wallet':
        return await handleConnectWallet(args);
      
      case 'generate_wallet':
        return await handleGenerateWallet(args);
      
      case 'get_wallet_info':
        return await handleGetWalletInfo();
      
      case 'execute_swap':
        return await handleExecuteSwap(args);
      
      case 'approve_token':
        return await handleApproveToken(args);
      
      case 'add_liquidity':
        return await handleAddLiquidity(args);
      
      case 'remove_liquidity':
        return await handleRemoveLiquidity(args);
      
      case 'check_token_allowance':
        return await handleCheckTokenAllowance(args);
      
      case 'disconnect_wallet':
        return await handleDisconnectWallet(args);
      
      default:
        throw new Error(`Unknown wallet tool: ${name}`);
    }
  } catch (error) {
    logger.error(`Wallet tool error (${name}):`, error);
    throw error;
  }
};

// Individual tool handlers

async function handleConnectWallet(_args: any) {
  return {
    success: false,
    error: 'External wallet connections have been disabled for security reasons.',
    data: {
      deprecationNotice: '⚠️ DEPRECATED: This feature has been removed for security.',
      migration: {
        newTool: 'create_new_wallet',
        description: 'Use create_new_wallet to get a secure auto-generated wallet',
        benefits: [
          '🔒 Enhanced security - no external wallet exposure',
          '🛡️ Automatic wallet generation per user',
          '🎯 Simplified user experience',
          '💾 Direct private key access when needed',
        ],
      },
    },
  };
}

async function handleGenerateWallet(_args: any) {
  return {
    success: false,
    error: 'This wallet generation method has been deprecated.',
    data: {
      deprecationNotice: '⚠️ DEPRECATED: Use the new user-centric wallet system.',
      migration: {
        newTool: 'create_new_wallet',
        description: 'Use create_new_wallet for improved security and user management',
        benefits: [
          '🔒 Session-based authentication',
          '🛡️ Better security isolation per user',
          '🎯 Streamlined user experience',
          '💾 Secure credential management',
        ],
      },
    },
  };
}

async function handleGetWalletInfo() {
  const walletInfos = await walletService.getWalletInfo();

  if (walletInfos.length === 0) {
    return {
      success: false,
      error: 'No wallet connected. Use connect_wallet or generate_wallet first.',
    };
  }

  return {
    success: true,
    data: {
      walletInfos,
      connectedChains: walletInfos.length,
      address: walletInfos[0]?.address,
      totalBalance: walletInfos.reduce((sum, info) => {
        return sum + parseFloat(info.nativeBalance);
      }, 0).toFixed(6),
    },
  };
}

async function handleExecuteSwap(args: any) {
  const { chainId, fromToken, toToken, amount, slippage = 0.5, deadline } = args;

  // Check if wallet is connected
  if (!walletService.isConnected(chainId)) {
    return {
      success: false,
      error: `Wallet not connected to chain ${chainId}. Use connect_wallet first.`,
    };
  }

  const userAddress = walletService.getWalletAddress();
  if (!userAddress) {
    return {
      success: false,
      error: 'No wallet address found',
    };
  }

  // Resolve token addresses
  const resolvedFromToken = resolveTokenAddress(fromToken, chainId);
  const resolvedToToken = resolveTokenAddress(toToken, chainId);

  const result = await walletService.executeSwap({
    chainId,
    fromToken: resolvedFromToken,
    toToken: resolvedToToken,
    amount,
    slippage,
    userAddress,
    deadline,
  });

  const config = get9MMConfig(chainId);

  return {
    success: result.success,
    data: result.success ? {
      txHash: result.txHash,
      chainName: config.name,
      explorerUrl: `${config.blockExplorer}/tx/${result.txHash}`,
      gasUsed: result.gasUsed,
      blockNumber: result.blockNumber,
      swapDetails: {
        from: fromToken,
        to: toToken,
        amount,
        slippage: `${slippage}%`,
      },
    } : null,
    error: result.error,
  };
}

async function handleApproveToken(args: any) {
  const { chainId, tokenAddress, amount } = args;

  if (!walletService.isConnected(chainId)) {
    return {
      success: false,
      error: `Wallet not connected to chain ${chainId}`,
    };
  }

  const config = get9MMConfig(chainId);
  const routerAddress = config.contracts.v2.router; // Use V2 router for approvals

  const result = await walletService.approveToken(
    chainId,
    tokenAddress,
    routerAddress,
    amount
  );

  return {
    success: result.success,
    data: result.success ? {
      txHash: result.txHash,
      chainName: config.name,
      explorerUrl: `${config.blockExplorer}/tx/${result.txHash}`,
      approvalDetails: {
        token: tokenAddress,
        spender: routerAddress,
        amount: amount || 'unlimited',
      },
    } : null,
    error: result.error,
  };
}

async function handleAddLiquidity(args: any) {
  const { chainId, tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, deadline } = args;

  if (!walletService.isConnected(chainId)) {
    return {
      success: false,
      error: `Wallet not connected to chain ${chainId}`,
    };
  }

  const userAddress = walletService.getWalletAddress();
  if (!userAddress) {
    return {
      success: false,
      error: 'No wallet address found',
    };
  }

  const result = await walletService.addLiquidity({
    chainId,
    tokenA,
    tokenB,
    amountADesired,
    amountBDesired,
    amountAMin,
    amountBMin,
    userAddress,
    deadline,
  });

  const config = get9MMConfig(chainId);

  return {
    success: result.success,
    data: result.success ? {
      txHash: result.txHash,
      chainName: config.name,
      explorerUrl: `${config.blockExplorer}/tx/${result.txHash}`,
      liquidityDetails: {
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
      },
    } : null,
    error: result.error,
  };
}

async function handleRemoveLiquidity(args: any) {
  const { chainId, tokenA, tokenB, liquidity, amountAMin, amountBMin, deadline } = args;

  if (!walletService.isConnected(chainId)) {
    return {
      success: false,
      error: `Wallet not connected to chain ${chainId}`,
    };
  }

  const userAddress = walletService.getWalletAddress();
  if (!userAddress) {
    return {
      success: false,
      error: 'No wallet address found',
    };
  }

  const result = await walletService.removeLiquidity(
    chainId,
    tokenA,
    tokenB,
    liquidity,
    amountAMin,
    amountBMin,
    userAddress,
    deadline
  );

  const config = get9MMConfig(chainId);

  return {
    success: result.success,
    data: result.success ? {
      txHash: result.txHash,
      chainName: config.name,
      explorerUrl: `${config.blockExplorer}/tx/${result.txHash}`,
      liquidityDetails: {
        tokenA,
        tokenB,
        liquidity,
        amountAMin,
        amountBMin,
      },
    } : null,
    error: result.error,
  };
}

async function handleCheckTokenAllowance(args: any) {
  const { chainId, tokenAddress, ownerAddress } = args;

  const owner = ownerAddress || walletService.getWalletAddress();
  if (!owner) {
    return {
      success: false,
      error: 'No wallet connected and no owner address provided',
    };
  }

  const config = get9MMConfig(chainId);
  const routerAddress = config.contracts.v2.router;

  try {
    const allowance = await walletService.getTokenAllowance(
      chainId,
      tokenAddress,
      owner,
      routerAddress
    );

    return {
      success: true,
      data: {
        chainName: config.name,
        tokenAddress,
        ownerAddress: owner,
        spenderAddress: routerAddress,
        allowance,
        needsApproval: allowance === '0',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function handleDisconnectWallet(args: any) {
  const { chainId } = args;

  walletService.disconnectWallet(chainId);

  return {
    success: true,
    data: {
      message: chainId 
        ? `Wallet disconnected from chain ${chainId}` 
        : 'Wallet disconnected from all chains',
      disconnectedFrom: chainId || 'all chains',
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
  const { COMMON_TOKENS } = require('../../config/9mm-config');
  const tokens = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS];
  if (tokens && tokens[tokenInput as keyof typeof tokens]) {
    return tokens[tokenInput as keyof typeof tokens];
  }
  
  // If not found, return as-is (might be a symbol not in our list)
  return tokenInput;
} 