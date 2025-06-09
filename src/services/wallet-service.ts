/**
 * Wallet Service
 * Secure wallet management and transaction execution for 9MM DEX MCP
 */

import { ethers, Wallet, HDNodeWallet } from 'ethers';
import { get9MMConfig } from '../config/9mm-config.js';
import { logger } from '../utils/logger.js';
import { nineMMService, I9MMSwapParams, I9MMLiquidityParams } from './nine-mm-service.js';
import { DEXAggregatorService } from './dex-aggregator.js';
import { DEXProtocol } from '../types/dex.js';

export interface IWalletConfig {
  privateKey?: string;
  mnemonic?: string;
  walletAddress?: string;
}

export interface ITransactionResult {
  success: boolean;
  txHash?: string | undefined;
  error?: string | undefined;
  gasUsed?: string | undefined;
  confirmations?: number | undefined;
  blockNumber?: number | undefined;
  metadata?: {
    dexUsed: DEXProtocol;
    quotedAmount: string;
    savings?: {
      percentage: number;
      amount: string;
    };
  } | undefined;
}

export interface IWalletInfo {
  address: string;
  chainId: number;
  nativeBalance: string;
  connected: boolean;
}

export class WalletService {
  private wallets: Map<number, Wallet | HDNodeWallet> = new Map(); // chainId -> Wallet
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private dexAggregator: DEXAggregatorService;

  constructor() {
    this.initializeProviders();
    this.dexAggregator = new DEXAggregatorService();
  }

  /**
   * Initialize providers for all supported chains
   */
  private initializeProviders(): void {
    for (const chainId of [8453, 369, 146]) {
      try {
        const config = get9MMConfig(chainId);
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.providers.set(chainId, provider);
        logger.info(`Wallet service provider initialized for ${config.name}`);
      } catch (error) {
        logger.error(`Failed to initialize wallet provider for chain ${chainId}:`, error);
      }
    }
  }

  /**
   * Import wallet from private key or mnemonic
   */
     async importWallet(config: IWalletConfig, chainIds: number[] = [8453, 369, 146]): Promise<IWalletInfo[]> {
     try {
       let wallet: Wallet | HDNodeWallet;

       if (config.privateKey) {
         wallet = new Wallet(config.privateKey);
         logger.info(`Wallet imported from private key: ${wallet.address}`);
       } else if (config.mnemonic) {
         wallet = Wallet.fromPhrase(config.mnemonic);
         logger.info(`Wallet imported from mnemonic: ${wallet.address}`);
       } else {
         throw new Error('Either privateKey or mnemonic must be provided');
       }

      const walletInfos: IWalletInfo[] = [];

      // Connect wallet to each chain
      for (const chainId of chainIds) {
        const provider = this.providers.get(chainId);
        if (!provider) {
          logger.warn(`No provider for chain ${chainId}, skipping`);
          continue;
        }

        const connectedWallet = wallet.connect(provider);
        this.wallets.set(chainId, connectedWallet);

        // Get native balance
        const balance = await provider.getBalance(wallet.address);
        const config = get9MMConfig(chainId);

        walletInfos.push({
          address: wallet.address,
          chainId,
          nativeBalance: ethers.formatEther(balance),
          connected: true,
        });

        logger.info(`Wallet connected to ${config.name}: ${wallet.address}`);
      }

      return walletInfos;

    } catch (error) {
      logger.error('Failed to import wallet:', error);
      throw error;
    }
  }

  /**
   * Generate a new wallet
   */
  async generateWallet(chainIds: number[] = [8453, 369, 146]): Promise<{
    walletInfo: IWalletInfo[];
    privateKey: string;
    mnemonic: string;
    address: string;
  }> {
    try {
      const wallet = Wallet.createRandom();
      
      const walletInfos = await this.importWallet({
        privateKey: wallet.privateKey,
      }, chainIds);

      return {
        walletInfo: walletInfos,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase || '',
        address: wallet.address,
      };

    } catch (error) {
      logger.error('Failed to generate wallet:', error);
      throw error;
    }
  }

  /**
   * Execute token swap transaction using DEX aggregator for best price
   */
  async executeSwap(params: I9MMSwapParams): Promise<ITransactionResult> {
    try {
      const wallet = this.wallets.get(params.chainId);
      if (!wallet) {
        throw new Error(`No wallet connected for chain ${params.chainId}`);
      }

      // Check if user has enough balance for gas
      await this.checkGasBalance(params.chainId, wallet.address);

      // Get best quote from aggregator
      logger.info(`Getting best swap quote from aggregator for chain ${params.chainId}`);
      const aggregatorResult = await this.dexAggregator.getBestQuote({
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount,
        slippage: params.slippage,
        userAddress: params.userAddress,
        deadline: params.deadline || Math.floor(Date.now() / 1000) + 1200, // 20 minutes default
        dexProtocol: DEXProtocol.NINE_MM, // Default protocol, aggregator will check all available
      });

      if (!aggregatorResult.success || !aggregatorResult.data) {
        throw new Error(`Failed to get quote: ${aggregatorResult.error?.message || 'Unknown error'}`);
      }

      const bestQuote = aggregatorResult.data.bestQuote;
      logger.info(`Best quote from ${bestQuote.dexProtocol}: ${bestQuote.toAmount} (savings: ${aggregatorResult.data.savings.percentage.toFixed(2)}%)`);

      // Execute swap based on the best DEX protocol
      let txHash: string;
      
      if (bestQuote.dexProtocol === DEXProtocol.NINE_MM) {
        // Use existing 9MM service for 9MM swaps
        txHash = await nineMMService.executeSwap(params, wallet);
      } else {
        // For other DEXs, we would need to implement execution methods
        // For now, fall back to 9MM if available on this chain
        if ([8453, 369, 146].includes(params.chainId)) {
          logger.warn(`Execution for ${bestQuote.dexProtocol} not implemented, falling back to 9MM DEX`);
          txHash = await nineMMService.executeSwap(params, wallet);
        } else {
          throw new Error(`Swap execution not implemented for ${bestQuote.dexProtocol} on chain ${params.chainId}`);
        }
      }
      
      // Wait for transaction confirmation
      const provider = this.providers.get(params.chainId);
      if (provider) {
        const receipt = await provider.waitForTransaction(txHash);
        
        return {
          success: true,
          txHash,
          gasUsed: receipt?.gasUsed.toString(),
          blockNumber: receipt?.blockNumber,
          metadata: {
            dexUsed: bestQuote.dexProtocol,
            quotedAmount: bestQuote.toAmount,
            savings: aggregatorResult.data.savings,
          }
        };
      }

      return {
        success: true,
        txHash,
        metadata: {
          dexUsed: bestQuote.dexProtocol,
          quotedAmount: bestQuote.toAmount,
        }
      };

    } catch (error) {
      logger.error('Failed to execute swap:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute add liquidity transaction
   */
  async addLiquidity(params: I9MMLiquidityParams): Promise<ITransactionResult> {
    try {
      const wallet = this.wallets.get(params.chainId);
      if (!wallet) {
        throw new Error(`No wallet connected for chain ${params.chainId}`);
      }

      await this.checkGasBalance(params.chainId, wallet.address);

      const txHash = await nineMMService.addLiquidity(params, wallet);
      
      const provider = this.providers.get(params.chainId);
      if (provider) {
        const receipt = await provider.waitForTransaction(txHash);
        
        return {
          success: true,
          txHash,
          gasUsed: receipt?.gasUsed.toString(),
          blockNumber: receipt?.blockNumber,
        };
      }

      return {
        success: true,
        txHash,
      };

    } catch (error) {
      logger.error('Failed to add liquidity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute remove liquidity transaction
   */
  async removeLiquidity(
    chainId: number,
    tokenA: string,
    tokenB: string,
    liquidity: string,
    amountAMin: string,
    amountBMin: string,
    userAddress: string,
    deadline?: number
  ): Promise<ITransactionResult> {
    try {
      const wallet = this.wallets.get(chainId);
      if (!wallet) {
        throw new Error(`No wallet connected for chain ${chainId}`);
      }

      await this.checkGasBalance(chainId, wallet.address);

      const txHash = await nineMMService.removeLiquidity(
        chainId,
        tokenA,
        tokenB,
        liquidity,
        amountAMin,
        amountBMin,
        userAddress,
        wallet,
        deadline
      );
      
      const provider = this.providers.get(chainId);
      if (provider) {
        const receipt = await provider.waitForTransaction(txHash);
        
        return {
          success: true,
          txHash,
          gasUsed: receipt?.gasUsed.toString(),
          blockNumber: receipt?.blockNumber,
        };
      }

      return {
        success: true,
        txHash,
      };

    } catch (error) {
      logger.error('Failed to remove liquidity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute token approval transaction
   */
  async approveToken(
    chainId: number,
    tokenAddress: string,
    spenderAddress: string,
    amount: string = ethers.MaxUint256.toString()
  ): Promise<ITransactionResult> {
    try {
      const wallet = this.wallets.get(chainId);
      if (!wallet) {
        throw new Error(`No wallet connected for chain ${chainId}`);
      }

      await this.checkGasBalance(chainId, wallet.address);

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        wallet
      );

      const tx = await tokenContract.approve(spenderAddress, amount);
      
      const provider = this.providers.get(chainId);
      if (provider) {
        const receipt = await provider.waitForTransaction(tx.hash);
        
        return {
          success: true,
          txHash: tx.hash,
          gasUsed: receipt?.gasUsed.toString(),
          blockNumber: receipt?.blockNumber,
        };
      }

      return {
        success: true,
        txHash: tx.hash,
      };

    } catch (error) {
      logger.error('Failed to approve token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get wallet info for all connected chains
   */
  async getWalletInfo(): Promise<IWalletInfo[]> {
    const walletInfos: IWalletInfo[] = [];

    for (const [chainId, wallet] of this.wallets) {
      try {
        const provider = this.providers.get(chainId);
        if (!provider) continue;

        const balance = await provider.getBalance(wallet.address);
        
        walletInfos.push({
          address: wallet.address,
          chainId,
          nativeBalance: ethers.formatEther(balance),
          connected: true,
        });
      } catch (error) {
        logger.error(`Failed to get wallet info for chain ${chainId}:`, error);
      }
    }

    return walletInfos;
  }

  /**
   * Check token allowance
   */
  async getTokenAllowance(
    chainId: number,
    tokenAddress: string,
    ownerAddress: string,
    spenderAddress: string
  ): Promise<string> {
    try {
      const provider = this.providers.get(chainId);
      if (!provider) {
        throw new Error(`No provider for chain ${chainId}`);
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        provider
      );

      const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
      return allowance.toString();

    } catch (error) {
      logger.error('Failed to get token allowance:', error);
      throw error;
    }
  }

  /**
   * Check if wallet has enough native tokens for gas
   */
  private async checkGasBalance(chainId: number, address: string): Promise<void> {
    const provider = this.providers.get(chainId);
    if (!provider) return;

    const balance = await provider.getBalance(address);
    const config = get9MMConfig(chainId);
    
    // Minimum balance required (0.001 ETH equivalent)
    const minBalance = ethers.parseEther('0.001');
    
    if (balance < minBalance) {
      const chainName = config.name;
      const nativeCurrency = config.nativeCurrency;
      throw new Error(
        `Insufficient ${nativeCurrency} balance for gas on ${chainName}. ` +
        `Current: ${ethers.formatEther(balance)} ${nativeCurrency}, ` +
        `Required: ${ethers.formatEther(minBalance)} ${nativeCurrency}`
      );
    }
  }

  /**
   * Disconnect wallet from specific chain or all chains
   */
  disconnectWallet(chainId?: number): void {
    if (chainId) {
      this.wallets.delete(chainId);
      logger.info(`Wallet disconnected from chain ${chainId}`);
    } else {
      this.wallets.clear();
      logger.info('Wallet disconnected from all chains');
    }
  }

  /**
   * Check if wallet is connected to specific chain
   */
  isConnected(chainId: number): boolean {
    return this.wallets.has(chainId);
  }

  /**
   * Get connected wallet address (same across all chains)
   */
  getWalletAddress(): string | null {
    const firstWallet = this.wallets.values().next().value;
    return firstWallet ? firstWallet.address : null;
  }
}

export const walletService = new WalletService(); 