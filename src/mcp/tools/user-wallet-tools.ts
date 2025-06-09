/**
 * User Wallet MCP Tools
 * Auto-generated wallet tools that replace external wallet connections
 * Users get automatically generated wallets instead of connecting MetaMask/external wallets
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { userService } from '../../services/user-service.js';
import { get9MMConfig } from '../../config/9mm-config.js';
import { logger } from '../../utils/logger.js';
import { walletService } from '../../services/wallet-service.js';

export const userWalletTools: Tool[] = [
  {
    name: 'create_new_wallet',
    description: 'Create a new user with auto-generated wallet (no external wallet connection needed)',
    inputSchema: {
      type: 'object',
      properties: {
        chainIds: {
          type: 'array',
          items: {
            type: 'number',
            enum: [8453, 369, 146],
          },
          description: 'Chain IDs to connect to (default: all supported)',
          default: [8453, 369, 146],
        },
      },
    },
  },

  {
    name: 'get_my_wallet_info',
    description: 'Get current user wallet information and balances',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'User authentication token',
        },
      },
      required: ['token'],
    },
  },

  {
    name: 'get_wallet_private_key',
    description: 'Get your wallet private key (SECURITY: Only you have access to this)',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'User authentication token',
        },
      },
      required: ['token'],
    },
  },

  {
    name: 'execute_wallet_swap',
    description: 'Execute token swap using your auto-generated wallet',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'User authentication token',
        },
        chainId: {
          type: 'number',
          enum: [8453, 369, 146],
          description: 'Chain ID for the swap',
        },
        fromToken: {
          type: 'string',
          description: 'Token to swap from (address or symbol)',
        },
        toToken: {
          type: 'string',
          description: 'Token to swap to (address or symbol)',
        },
        amount: {
          type: 'string',
          description: 'Amount to swap (in smallest unit)',
        },
        slippage: {
          type: 'number',
          description: 'Slippage tolerance (0.1-50)',
          default: 0.5,
        },
        deadline: {
          type: 'number',
          description: 'Transaction deadline in minutes',
          default: 20,
        },
      },
      required: ['token', 'chainId', 'fromToken', 'toToken', 'amount'],
    },
  },

  {
    name: 'approve_wallet_token',
    description: 'Approve token spending using your auto-generated wallet',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'User authentication token',
        },
        chainId: {
          type: 'number',
          enum: [8453, 369, 146],
          description: 'Chain ID for the approval',
        },
        tokenAddress: {
          type: 'string',
          description: 'Token contract address to approve',
        },
        amount: {
          type: 'string',
          description: 'Amount to approve (optional, defaults to unlimited)',
        },
      },
      required: ['token', 'chainId', 'tokenAddress'],
    },
  },

  {
    name: 'check_wallet_allowance',
    description: 'Check token allowance for your auto-generated wallet',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'User authentication token',
        },
        chainId: {
          type: 'number',
          enum: [8453, 369, 146],
          description: 'Chain ID to check',
        },
        tokenAddress: {
          type: 'string',
          description: 'Token contract address',
        },
      },
      required: ['token', 'chainId', 'tokenAddress'],
    },
  },

  {
    name: 'logout_wallet',
    description: 'Logout and securely disconnect your wallet session',
    inputSchema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'User authentication token',
        },
      },
      required: ['token'],
    },
  },
];

// Tool handler mapping
export async function handleUserWalletTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      case 'create_new_wallet':
        return await handleCreateNewWallet(args);
      case 'get_my_wallet_info':
        return await handleGetMyWalletInfo(args);
      case 'get_wallet_private_key':
        return await handleGetWalletPrivateKey(args);
      case 'execute_wallet_swap':
        return await handleExecuteWalletSwap(args);
      case 'approve_wallet_token':
        return await handleApproveWalletToken(args);
      case 'check_wallet_allowance':
        return await handleCheckWalletAllowance(args);
      case 'logout_wallet':
        return await handleLogoutWallet(args);
      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`,
        };
    }
  } catch (error) {
    logger.error(`Error in user wallet tool ${name}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Individual tool handlers

async function handleCreateNewWallet(args: any) {
  const { chainIds = [8453, 369, 146] } = args;

  try {
    const userSession = await userService.createUser(chainIds);

    return {
      success: true,
      data: {
        user: {
          id: userSession.user.id,
          walletAddress: userSession.user.walletAddress,
          createdAt: userSession.user.createdAt,
        },
        wallet: {
          address: userSession.wallet.address,
          privateKey: userSession.wallet.privateKey,
          mnemonic: userSession.wallet.mnemonic,
                     supportedChains: chainIds.map((id: number) => get9MMConfig(id).name),
        },
        token: userSession.token,
        message: 'New wallet created successfully! Save your private key and mnemonic safely.',
        securityInstructions: [
          '🔒 Your wallet has been automatically generated for you',
          '⚠️ SAVE YOUR PRIVATE KEY AND MNEMONIC SAFELY - This is the ONLY way to access your funds',
          '🛡️ Never share your private key or mnemonic with anyone',
          '💾 Store them offline in a secure location',
          '🚨 If you lose them, you lose access to your funds forever',
          '✅ You can now trade safely using only this wallet',
        ],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet',
    };
  }
}

async function handleGetMyWalletInfo(args: any) {
  const { token } = args;

  const userSession = userService.getUserSession(token);
  if (!userSession) {
    return {
      success: false,
      error: 'Invalid or expired token. Please create a new wallet.',
    };
  }

  try {
    // Initialize user wallet for balance checking
    await userService.initializeUserWallet(userSession.user.id);
    const balances = await userService.getUserBalances(userSession.user.id);

    const chainNames = balances.map((balance: any) => get9MMConfig(balance.chainId).name);

    return {
      success: true,
      data: {
        user: {
          id: userSession.user.id,
          walletAddress: userSession.user.walletAddress,
          createdAt: userSession.user.createdAt,
          lastActive: userSession.user.lastActive,
        },
        wallet: {
          address: userSession.wallet.address,
          supportedChains: chainNames,
        },
        balances,
        totalConnectedChains: balances.length,
        totalBalance: balances.reduce((sum: number, info: any) => {
          return sum + parseFloat(info.nativeBalance);
        }, 0).toFixed(6),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallet info',
    };
  }
}

async function handleGetWalletPrivateKey(args: any) {
  const { token } = args;

  const userSession = userService.getUserSession(token);
  if (!userSession) {
    return {
      success: false,
      error: 'Invalid or expired token. Please create a new wallet.',
    };
  }

  return {
    success: true,
    data: {
      walletAddress: userSession.wallet.address,
      privateKey: userSession.wallet.privateKey,
      mnemonic: userSession.wallet.mnemonic,
      securityWarning: [
        '🔒 CRITICAL SECURITY INFORMATION',
        '⚠️ This is your private key - it controls your funds',
        '🛡️ NEVER share this with anyone',
        '💾 Save this in a secure, offline location',
        '🚨 Anyone with this key can steal your funds',
        '✅ You are responsible for keeping this safe',
      ],
    },
  };
}

async function handleExecuteWalletSwap(args: any) {
  const { token, chainId, fromToken, toToken, amount, slippage = 0.5, deadline = 20 } = args;

  const userSession = userService.getUserSession(token);
  if (!userSession) {
    return {
      success: false,
      error: 'Invalid or expired token. Please create a new wallet.',
    };
  }

  try {
    // Initialize user wallet for trading
    await userService.initializeUserWallet(userSession.user.id);

    // Execute the swap
    const swapParams: any = {
      chainId,
      fromToken,
      toToken,
      amount,
      slippage,
      userAddress: userSession.wallet.address,
    };
    
    if (deadline) {
      swapParams.deadline = Date.now() + (deadline * 60 * 1000);
    }
    
    const result = await walletService.executeSwap(swapParams);

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
          walletUsed: userSession.wallet.address,
          dexUsed: result.metadata?.dexUsed || 'Unknown',
          quotedAmount: result.metadata?.quotedAmount || 'Unknown',
        },
        aggregatorSavings: result.metadata?.savings ? {
          amount: result.metadata.savings.amount,
          percentage: `${result.metadata.savings.percentage.toFixed(2)}%`,
          message: `You saved ${result.metadata.savings.percentage.toFixed(2)}% by using our DEX aggregator!`
        } : undefined,
      } : null,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute swap',
    };
  }
}

async function handleApproveWalletToken(args: any) {
  const { token, chainId, tokenAddress, amount } = args;

  const userSession = userService.getUserSession(token);
  if (!userSession) {
    return {
      success: false,
      error: 'Invalid or expired token. Please create a new wallet.',
    };
  }

  try {
    // Initialize user wallet for trading
    await userService.initializeUserWallet(userSession.user.id);

    const config = get9MMConfig(chainId);
    const routerAddress = config.contracts.v2.router;

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
          walletUsed: userSession.wallet.address,
        },
      } : null,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve token',
    };
  }
}

async function handleCheckWalletAllowance(args: any) {
  const { token, chainId, tokenAddress } = args;

  const userSession = userService.getUserSession(token);
  if (!userSession) {
    return {
      success: false,
      error: 'Invalid or expired token. Please create a new wallet.',
    };
  }

  try {
    const config = get9MMConfig(chainId);
    const routerAddress = config.contracts.v2.router;

    const allowance = await walletService.getTokenAllowance(
      chainId,
      tokenAddress,
      userSession.wallet.address,
      routerAddress
    );

    return {
      success: true,
      data: {
        chainName: config.name,
        tokenAddress,
        ownerAddress: userSession.wallet.address,
        spenderAddress: routerAddress,
        allowance,
        needsApproval: allowance === '0',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check allowance',
    };
  }
}

async function handleLogoutWallet(args: any) {
  const { token } = args;

  const success = userService.revokeSession(token);

  return {
    success,
    data: success ? {
      message: 'Wallet session ended successfully',
      securityNote: 'Your private key and mnemonic are still yours to keep safely',
    } : null,
    error: success ? undefined : 'Failed to logout or session already expired',
  };
} 