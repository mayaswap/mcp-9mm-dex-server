/**
 * 9MM DEX Service
 * Multi-chain 9MM DEX operations for Base, PulseChain, and Sonic
 */

import { ethers, Contract } from 'ethers';
import { get9MMConfig, getAllSupported9MMChains, COMMON_TOKENS, NINE_MM_FEES } from '../config/9mm-config.js';
import { logger } from '../utils/logger.js';

export interface I9MMSwapParams {
  chainId: number;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number; // 0.5 = 0.5%
  userAddress: string;
  deadline?: number; // Unix timestamp
}

export interface I9MMSwapQuote {
  chainId: number;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  priceImpact: number;
  fee: number;
  gasEstimate: string;
  route: string[];
  validUntil: number;
}

export interface I9MMLiquidityParams {
  chainId: number;
  tokenA: string;
  tokenB: string;
  amountADesired: string;
  amountBDesired: string;
  amountAMin: string;
  amountBMin: string;
  userAddress: string;
  deadline?: number;
}

export interface I9MMPoolInfo {
  chainId: number;
  address: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  fee: number;
  volume24h: string;
  liquidityUSD: string;
  apr: number;
}

export class NineMMService {
  private providers: Map<number, ethers.JsonRpcProvider> = new Map();
  private contracts: Map<string, Contract> = new Map();

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize providers for all 9MM chains
   */
  private initializeProviders(): void {
    const chains = getAllSupported9MMChains();
    
    chains.forEach(chain => {
      try {
        const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
        this.providers.set(chain.chainId, provider);
        logger.info(`Initialized 9MM provider for ${chain.name} (${chain.chainId})`);
      } catch (error) {
        logger.error(`Failed to initialize provider for ${chain.name}:`, error);
      }
    });
  }

  /**
   * Get quote for token swap on 9MM
   */
  async getSwapQuote(params: I9MMSwapParams): Promise<I9MMSwapQuote> {
    try {
      // Validate chain is supported
      get9MMConfig(params.chainId);
      const provider = this.providers.get(params.chainId);
      
      if (!provider) {
        throw new Error(`No provider for chain ${params.chainId}`);
      }

      // Get router contract
      const router = await this.getRouterContract(params.chainId);
      
      // Calculate amounts out
      const path = [params.fromToken, params.toToken];
      const amountsOut = await router.getAmountsOut(params.amount, path);
      const toAmount = amountsOut[1].toString();
      
      // Calculate minimum amount with slippage
      const slippageBN = BigInt(Math.floor(params.slippage * 100)); // Convert to basis points
      const toAmountBN = BigInt(toAmount);
      const toAmountMin = (toAmountBN * (10000n - slippageBN) / 10000n).toString();

      // Estimate gas (using fallback method due to typing issues)
      const gasEstimate = await router.getFunction('swapExactTokensForTokens').estimateGas(
        params.amount,
        toAmountMin,
        path,
        params.userAddress,
        params.deadline || Math.floor(Date.now() / 1000) + 1200 // 20 minutes
      );

      // Calculate price impact (simplified)
      const priceImpact = this.calculatePriceImpact(params.amount, toAmount, path);

      return {
        chainId: params.chainId,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.amount,
        toAmount,
        toAmountMin,
        priceImpact,
        fee: NINE_MM_FEES.v2,
        gasEstimate: gasEstimate.toString(),
        route: path,
        validUntil: Date.now() + 30000, // 30 seconds
      };

    } catch (error) {
      logger.error(`Failed to get 9MM swap quote:`, error);
      throw error;
    }
  }

  /**
   * Execute token swap on 9MM
   */
  async executeSwap(params: I9MMSwapParams, signer: ethers.Signer): Promise<string> {
    try {
      const quote = await this.getSwapQuote(params);
      const router = await this.getRouterContract(params.chainId, signer);
      
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1200;
      
      const tx = await router.swapExactTokensForTokens(
        params.amount,
        quote.toAmountMin,
        [params.fromToken, params.toToken],
        params.userAddress,
        deadline,
        {
          gasLimit: quote.gasEstimate,
        }
      );

      logger.info(`9MM swap executed on ${get9MMConfig(params.chainId).name}: ${tx.hash}`);
      return tx.hash;

    } catch (error) {
      logger.error(`Failed to execute 9MM swap:`, error);
      throw error;
    }
  }

  /**
   * Add liquidity to 9MM pool
   */
  async addLiquidity(params: I9MMLiquidityParams, signer: ethers.Signer): Promise<string> {
    try {
      const router = await this.getRouterContract(params.chainId, signer);
      const deadline = params.deadline || Math.floor(Date.now() / 1000) + 1200;

      const tx = await router.addLiquidity(
        params.tokenA,
        params.tokenB,
        params.amountADesired,
        params.amountBDesired,
        params.amountAMin,
        params.amountBMin,
        params.userAddress,
        deadline
      );

      logger.info(`9MM liquidity added on ${get9MMConfig(params.chainId).name}: ${tx.hash}`);
      return tx.hash;

    } catch (error) {
      logger.error(`Failed to add 9MM liquidity:`, error);
      throw error;
    }
  }

  /**
   * Remove liquidity from 9MM pool
   */
  async removeLiquidity(
    chainId: number,
    tokenA: string,
    tokenB: string,
    liquidity: string,
    amountAMin: string,
    amountBMin: string,
    userAddress: string,
    signer: ethers.Signer,
    deadline?: number
  ): Promise<string> {
    try {
      const router = await this.getRouterContract(chainId, signer);
      const deadlineTimestamp = deadline || Math.floor(Date.now() / 1000) + 1200;

      const tx = await router.removeLiquidity(
        tokenA,
        tokenB,
        liquidity,
        amountAMin,
        amountBMin,
        userAddress,
        deadlineTimestamp
      );

      logger.info(`9MM liquidity removed on ${get9MMConfig(chainId).name}: ${tx.hash}`);
      return tx.hash;

    } catch (error) {
      logger.error(`Failed to remove 9MM liquidity:`, error);
      throw error;
    }
  }

  /**
   * Get pool information
   */
  async getPoolInfo(chainId: number, tokenA: string, tokenB: string): Promise<I9MMPoolInfo> {
    try {
      const factory = await this.getFactoryContract(chainId);
      const pairAddress = await factory.getPair(tokenA, tokenB);
      
      if (pairAddress === ethers.ZeroAddress) {
        throw new Error('Pool does not exist');
      }

      const pairContract = await this.getPairContract(chainId, pairAddress);
      const [reserves, totalSupply] = await Promise.all([
        pairContract.getReserves(),
        pairContract.totalSupply(),
      ]);

      return {
        chainId,
        address: pairAddress,
        token0: tokenA,
        token1: tokenB,
        reserve0: reserves._reserve0.toString(),
        reserve1: reserves._reserve1.toString(),
        totalSupply: totalSupply.toString(),
        fee: NINE_MM_FEES.v2,
        volume24h: '0', // Would need additional data source
        liquidityUSD: '0', // Would need price feeds
        apr: 0, // Would need historical data
      };

    } catch (error) {
      logger.error(`Failed to get 9MM pool info:`, error);
      throw error;
    }
  }

  /**
   * Compare prices across all 9MM chains
   */
  async compareChainPrices(fromToken: string, toToken: string, amount: string): Promise<I9MMSwapQuote[]> {
    const quotes: I9MMSwapQuote[] = [];
    
    for (const chainId of [8453, 369, 146]) {
      try {
        const quote = await this.getSwapQuote({
          chainId,
          fromToken,
          toToken,
          amount,
          slippage: 0.5,
          userAddress: ethers.ZeroAddress, // Placeholder for quote
        });
        quotes.push(quote);
      } catch (error) {
        logger.warn(`Failed to get quote on chain ${chainId}:`, error);
      }
    }

    // Sort by best price (highest output amount)
    return quotes.sort((a, b) => 
      Number(BigInt(b.toAmount) - BigInt(a.toAmount))
    );
  }

  /**
   * Get best chain for trading specific pair
   */
  async getBestChainForPair(fromToken: string, toToken: string, amount: string): Promise<I9MMSwapQuote | null> {
    const quotes = await this.compareChainPrices(fromToken, toToken, amount);
    return quotes.length > 0 ? quotes[0] : null;
  }

  /**
   * Get user's 9MM token balances across all chains
   */
  async getUserBalances(userAddress: string): Promise<Record<number, Record<string, string>>> {
    const balances: Record<number, Record<string, string>> = {};
    
    for (const chainId of [8453, 369, 146]) {
      balances[chainId] = {};
      const provider = this.providers.get(chainId);
      
      if (!provider) continue;

      try {
        // Get native token balance
        const nativeBalance = await provider.getBalance(userAddress);
        const config = get9MMConfig(chainId);
        balances[chainId][config.nativeCurrency] = nativeBalance.toString();

        // Get 9MM token balance
        const tokens = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS];
        if (tokens) {
          for (const [symbol, address] of Object.entries(tokens)) {
            try {
              const tokenContract = new Contract(
                address,
                ['function balanceOf(address) view returns (uint256)'],
                provider
              );
              const balance = await tokenContract.balanceOf(userAddress);
              balances[chainId][symbol] = balance.toString();
            } catch (error) {
              logger.warn(`Failed to get ${symbol} balance on chain ${chainId}:`, error);
            }
          }
        }
      } catch (error) {
        logger.error(`Failed to get balances on chain ${chainId}:`, error);
      }
    }

    return balances;
  }

  // Private helper methods

  private async getRouterContract(chainId: number, signer?: ethers.Signer): Promise<Contract> {
    const key = `router-${chainId}`;
    
    if (!this.contracts.has(key)) {
      const config = get9MMConfig(chainId);
      const provider = signer || this.providers.get(chainId);
      
      if (!provider) {
        throw new Error(`No provider for chain ${chainId}`);
      }

      // 9MM Router ABI (simplified - would need full ABI from deployment)
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
        'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] memory amounts)',
        'function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)',
        'function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)',
      ];

      const contract = new Contract(config.contracts.v2.router, routerABI, provider);
      this.contracts.set(key, contract);
    }

    return this.contracts.get(key)!;
  }

  private async getFactoryContract(chainId: number): Promise<Contract> {
    const key = `factory-${chainId}`;
    
    if (!this.contracts.has(key)) {
      const config = get9MMConfig(chainId);
      const provider = this.providers.get(chainId);
      
      if (!provider) {
        throw new Error(`No provider for chain ${chainId}`);
      }

      const factoryABI = [
        'function getPair(address tokenA, address tokenB) view returns (address pair)',
      ];

      const contract = new Contract(config.contracts.v2.factory, factoryABI, provider);
      this.contracts.set(key, contract);
    }

    return this.contracts.get(key)!;
  }

  private async getPairContract(chainId: number, pairAddress: string): Promise<Contract> {
    const provider = this.providers.get(chainId);
    
    if (!provider) {
      throw new Error(`No provider for chain ${chainId}`);
    }

    const pairABI = [
      'function getReserves() view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)',
      'function totalSupply() view returns (uint256)',
      'function token0() view returns (address)',
      'function token1() view returns (address)',
    ];

    return new Contract(pairAddress, pairABI, provider);
  }

  private calculatePriceImpact(amountIn: string, amountOut: string, _path: string[]): number {
    // Simplified price impact calculation based on input/output ratio
    const inputBN = BigInt(amountIn);
    const outputBN = BigInt(amountOut);
    
    // Calculate basic price impact based on trade size and efficiency
    if (inputBN === 0n || outputBN === 0n) return 0;
    
    // Simple approximation: larger trades = higher impact
    const tradeSizeImpact = Number(inputBN) / 1e21; // Scale factor
    const efficiency = Number(outputBN) / Number(inputBN); // Output/input ratio
    
    // Higher impact for less efficient trades
    const baseImpact = tradeSizeImpact * 0.1;
    const efficiencyAdjustment = efficiency < 0.95 ? 0.5 : 0;
    
    return Math.min(baseImpact + efficiencyAdjustment, 5); // Cap at 5%
  }
}

export const nineMMService = new NineMMService(); 