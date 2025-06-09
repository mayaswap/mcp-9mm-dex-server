/**
 * DEX Aggregator Service
 * Multi-protocol DEX integration with API support for any EVM DEX
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import {
  DEXProtocol,
  IDEXInfo,
  ISwapQuote,
  ISwapParams,
  IDEXAggregatorQuote,
  IAPIResponse,
  IToken,
} from '../types/dex.js';

interface IDEXAPIConfig {
  protocol: DEXProtocol;
  name: string;
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  supportedChains: number[];
  endpoints: {
    quote?: string;
    swap?: string;
    pools?: string;
    tokens?: string;
  };
  isActive: boolean;
}

export class DEXAggregatorService {
  private dexConfigs: Map<DEXProtocol, IDEXAPIConfig> = new Map();
  private httpClients: Map<DEXProtocol, AxiosInstance> = new Map();

  constructor() {
    this.initializeDEXConfigs();
    this.createHTTPClients();
  }

  /**
   * Initialize DEX API configurations
   */
  private initializeDEXConfigs(): void {
    const configs: IDEXAPIConfig[] = [
      {
        protocol: DEXProtocol.ONEINCH,
        name: '1inch',
        baseURL: 'https://api.1inch.dev',
        endpoints: {
          quote: '/swap/v5.2/{chainId}/quote',
          swap: '/swap/v5.2/{chainId}/swap',
          tokens: '/swap/v5.2/{chainId}/tokens',
        },
        supportedChains: [1, 56, 137, 42161, 10, 8453],
        isActive: true,
      },
      {
        protocol: DEXProtocol.PARASWAP,
        name: 'ParaSwap',
        baseURL: 'https://apiv5.paraswap.io',
        endpoints: {
          quote: '/prices',
          swap: '/transactions/{chainId}',
          tokens: '/tokens/{chainId}',
        },
        supportedChains: [1, 56, 137, 42161, 10, 43114],
        isActive: true,
      },
      {
        protocol: DEXProtocol.UNISWAP_V3,
        name: 'Uniswap V3',
        baseURL: 'https://api.uniswap.org',
        endpoints: {
          quote: '/v1/quote',
          pools: '/v1/pools',
        },
        supportedChains: [1, 137, 42161, 10, 8453],
        isActive: true,
      },
      {
        protocol: DEXProtocol.SUSHISWAP,
        name: 'SushiSwap',
        baseURL: 'https://api.sushi.com',
        endpoints: {
          quote: '/swap/v4/{chainId}/quote',
          pools: '/pool/v1/{chainId}',
        },
        supportedChains: [1, 56, 137, 42161, 10],
        isActive: true,
      },
      {
        protocol: DEXProtocol.PANCAKESWAP,
        name: 'PancakeSwap',
        baseURL: 'https://api.pancakeswap.info',
        endpoints: {
          quote: '/api/v2/quote',
          pools: '/api/v2/pairs',
        },
        supportedChains: [56],
        isActive: true,
      },
      {
        protocol: DEXProtocol.NINE_MM,
        name: '9MM DEX Aggregator',
        baseURL: 'https://api.9mm.pro',
        endpoints: {
          quote: '/swap/v1/quote',
          swap: '/swap/v1/swap',
          pools: '/pools',
        },
        supportedChains: [8453, 369, 146], // Base, PulseChain, Sonic
        isActive: true,
      },
    ];

    configs.forEach(config => {
      this.dexConfigs.set(config.protocol, config);
    });

    logger.info(`Initialized ${configs.length} DEX configurations`);
  }

  /**
   * Create HTTP clients for each DEX
   */
  private createHTTPClients(): void {
    this.dexConfigs.forEach((config, protocol) => {
      const client = axios.create({
        baseURL: config.baseURL,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCP-EVM-DEX-Server/1.0.0',
          ...config.headers,
        },
      });

      // Add request interceptor for API keys
      client.interceptors.request.use((requestConfig) => {
        if (config.apiKey) {
          requestConfig.headers['Authorization'] = `Bearer ${config.apiKey}`;
        }
        return requestConfig;
      });

      // Add response interceptor for logging
      client.interceptors.response.use(
        (response) => {
          logger.debug(`${config.name} API response: ${response.status}`);
          return response;
        },
        (error) => {
          logger.error(`${config.name} API error:`, error.response?.data || error.message);
          return Promise.reject(error);
        }
      );

      this.httpClients.set(protocol, client);
    });
  }

  /**
   * Get the best swap quote across all DEXs
   * Prioritizes 9MM DEX for supported chains (Base, PulseChain, Sonic)
   */
  async getBestQuote(params: ISwapParams): Promise<IAPIResponse<IDEXAggregatorQuote>> {
    const startTime = Date.now();

    try {
      // Check if 9MM DEX supports this chain and prioritize it
      const is9MMChain = [8453, 369, 146].includes(params.chainId);
      let availableDEXs = this.getAvailableDEXsForChain(params.chainId);
      
      // Prioritize 9MM for supported chains
      if (is9MMChain) {
        availableDEXs = availableDEXs.filter(dex => dex !== DEXProtocol.NINE_MM);
        availableDEXs.unshift(DEXProtocol.NINE_MM); // Add 9MM at the beginning
      }

      const quotePromises = availableDEXs.map(dex => 
        this.getQuoteFromDEX(dex, params)
      );

      const results = await Promise.allSettled(quotePromises);
      const validQuotes: ISwapQuote[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success && result.value.data) {
          validQuotes.push(result.value.data);
        } else {
          logger.warn(`Quote failed for ${availableDEXs[index]}:`, 
            result.status === 'rejected' ? result.reason : result.value.error
          );
        }
      });

      if (validQuotes.length === 0) {
        throw new Error('No valid quotes found from any DEX');
      }

      // For 9MM chains, prefer 9MM quote if it's competitive (within 1% of best)
      let bestQuote = validQuotes.reduce((best, current) => 
        parseFloat(current.toAmount) > parseFloat(best.toAmount) ? current : best
      );

      if (is9MMChain) {
        const nineMMQuote = validQuotes.find(q => q.dexProtocol === DEXProtocol.NINE_MM);
        if (nineMMQuote) {
          const bestAmount = parseFloat(bestQuote.toAmount);
          const nineMMAmount = parseFloat(nineMMQuote.toAmount);
          const difference = (bestAmount - nineMMAmount) / bestAmount;
          
          // Use 9MM if it's within 1% of the best quote (to support 9MM ecosystem)
          if (difference <= 0.01) {
            bestQuote = nineMMQuote;
            logger.info(`Using 9MM DEX quote (${difference * 100}% difference from best)`);
          }
        }
      }

      // Calculate savings compared to worst quote
      const worstQuote = validQuotes.reduce((worst, current) => 
        parseFloat(current.toAmount) < parseFloat(worst.toAmount) ? current : worst
      );

      const savings = {
        amount: (parseFloat(bestQuote.toAmount) - parseFloat(worstQuote.toAmount)).toString(),
        percentage: ((parseFloat(bestQuote.toAmount) - parseFloat(worstQuote.toAmount)) / parseFloat(worstQuote.toAmount)) * 100,
      };

      const aggregatorQuote: IDEXAggregatorQuote = {
        bestQuote,
        allQuotes: validQuotes,
        savings,
        recommendedDEX: bestQuote.dexProtocol,
      };

      return {
        success: true,
        data: aggregatorQuote,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: 'dex_aggregator',
          chainId: params.chainId,
        },
      };

    } catch (error) {
      logger.error('DEX aggregator error:', error);
      
      return {
        success: false,
        error: {
          code: 'AGGREGATOR_ERROR',
          message: error instanceof Error ? error.message : 'Unknown aggregator error',
          details: params,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: 'dex_aggregator',
          chainId: params.chainId,
        },
      };
    }
  }

  /**
   * Get quote from a specific DEX
   */
  async getQuoteFromDEX(protocol: DEXProtocol, params: ISwapParams): Promise<IAPIResponse<ISwapQuote>> {
    const startTime = Date.now();

    try {
      const config = this.dexConfigs.get(protocol);
      const client = this.httpClients.get(protocol);

      if (!config || !client) {
        throw new Error(`DEX ${protocol} not configured`);
      }

      if (!config.supportedChains.includes(params.chainId)) {
        throw new Error(`Chain ${params.chainId} not supported by ${protocol}`);
      }

      let quote: ISwapQuote;

      switch (protocol) {
        case DEXProtocol.ONEINCH:
          quote = await this.get1inchQuote(client, config, params);
          break;
        case DEXProtocol.PARASWAP:
          quote = await this.getParaswapQuote(client, config, params);
          break;
        case DEXProtocol.UNISWAP_V3:
          quote = await this.getUniswapQuote(client, config, params);
          break;
        case DEXProtocol.SUSHISWAP:
          quote = await this.getSushiswapQuote(client, config, params);
          break;
        case DEXProtocol.PANCAKESWAP:
          quote = await this.getPancakeswapQuote(client, config, params);
          break;
        case DEXProtocol.NINE_MM:
          quote = await this.get9MMQuote(params);
          break;
        default:
          throw new Error(`Quote method not implemented for ${protocol}`);
      }

      return {
        success: true,
        data: quote,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: protocol,
          chainId: params.chainId,
        },
      };

    } catch (error) {
      logger.error(`${protocol} quote error:`, error);
      
      return {
        success: false,
        error: {
          code: 'DEX_QUOTE_ERROR',
          message: error instanceof Error ? error.message : `Unknown ${protocol} error`,
          details: { protocol, params },
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: protocol,
          chainId: params.chainId,
        },
      };
    }
  }

  /**
   * Get 1inch quote
   */
  private async get1inchQuote(client: AxiosInstance, config: IDEXAPIConfig, params: ISwapParams): Promise<ISwapQuote> {
    const endpoint = config.endpoints.quote?.replace('{chainId}', params.chainId.toString());
    
    const response = await client.get(endpoint!, {
      params: {
        fromTokenAddress: params.fromToken,
        toTokenAddress: params.toToken,
        amount: params.amount,
        slippage: params.slippage,
      },
    });

    const data = response.data;

    return {
      dexProtocol: DEXProtocol.ONEINCH,
      fromToken: this.createTokenFromAddress(params.fromToken, params.chainId),
      toToken: this.createTokenFromAddress(params.toToken, params.chainId),
      fromAmount: params.amount,
      toAmount: data.toTokenAmount,
      toAmountMin: data.toTokenAmount, // 1inch includes slippage
      priceImpact: parseFloat(data.estimatedGas) / 1000000, // Rough estimate
      slippage: params.slippage,
      gasEstimate: data.estimatedGas,
      gasPrice: '20', // Default
      route: [], // 1inch doesn't provide detailed route
      validUntil: Date.now() + 30000, // 30 seconds
      chainId: params.chainId,
    };
  }

  /**
   * Get ParaSwap quote
   */
  private async getParaswapQuote(client: AxiosInstance, config: IDEXAPIConfig, params: ISwapParams): Promise<ISwapQuote> {
    const response = await client.get(config.endpoints.quote!, {
      params: {
        srcToken: params.fromToken,
        destToken: params.toToken,
        amount: params.amount,
        srcDecimals: 18, // Default, should be fetched
        destDecimals: 18, // Default, should be fetched
        network: params.chainId,
        slippage: params.slippage * 100, // ParaSwap uses basis points
      },
    });

    const data = response.data.priceRoute;

    return {
      dexProtocol: DEXProtocol.PARASWAP,
      fromToken: this.createTokenFromAddress(params.fromToken, params.chainId),
      toToken: this.createTokenFromAddress(params.toToken, params.chainId),
      fromAmount: params.amount,
      toAmount: data.destAmount,
      toAmountMin: data.destAmount,
      priceImpact: parseFloat(data.gasCost) / 1000000,
      slippage: params.slippage,
      gasEstimate: data.gasCost,
      gasPrice: '20',
      route: [],
      validUntil: Date.now() + 30000,
      chainId: params.chainId,
    };
  }

  /**
   * Get Uniswap quote (placeholder - would use Uniswap SDK)
   */
  private async getUniswapQuote(_client: AxiosInstance, _config: IDEXAPIConfig, _params: ISwapParams): Promise<ISwapQuote> {
    // This would integrate with Uniswap SDK or API
    throw new Error('Uniswap quote integration not yet implemented - use SDK');
  }

  /**
   * Get SushiSwap quote
   */
  private async getSushiswapQuote(_client: AxiosInstance, _config: IDEXAPIConfig, _params: ISwapParams): Promise<ISwapQuote> {
    // SushiSwap integration placeholder
    throw new Error('SushiSwap quote integration not yet implemented');
  }

  /**
   * Get PancakeSwap quote
   */
  private async getPancakeswapQuote(_client: AxiosInstance, _config: IDEXAPIConfig, _params: ISwapParams): Promise<ISwapQuote> {
    // PancakeSwap integration placeholder
    throw new Error('PancakeSwap quote integration not yet implemented');
  }

  /**
   * Get 9MM DEX quote using the actual 9MM swap APIs
   */
  private async get9MMQuote(params: ISwapParams): Promise<ISwapQuote> {
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

      logger.info(`Getting 9MM quote from: ${url}?${queryParams.toString()}`);

      const response = await axios.get(`${url}?${queryParams.toString()}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'MCP-9MM-DEX-Server/1.0.0',
        },
      });

      if (!response.data) {
        throw new Error('Invalid response from 9MM API');
      }

      const data = response.data;
      
      // Calculate minimum amount with slippage
      const toAmountMin = data.buyAmount ? 
        (BigInt(data.buyAmount) * BigInt(Math.floor((100 - params.slippage) * 100)) / BigInt(10000)).toString() :
        '0';

      return {
        dexProtocol: DEXProtocol.NINE_MM,
        fromToken: this.createTokenFromAddress(params.fromToken, params.chainId),
        toToken: this.createTokenFromAddress(params.toToken, params.chainId),
        fromAmount: params.amount,
        toAmount: data.buyAmount || '0',
        toAmountMin,
        priceImpact: parseFloat(data.estimatedPriceImpact || '0'),
        slippage: params.slippage,
        gasEstimate: data.estimatedGas || '300000',
        gasPrice: data.gasPrice || '20000000000', // 20 gwei default
        route: data.sources || [], // 9MM provides sources in response
        validUntil: Date.now() + 30000, // 30 seconds
        chainId: params.chainId,
      };

    } catch (error) {
      logger.error('9MM API quote error:', error);
      throw error;
    }
  }

  /**
   * Add custom DEX configuration
   */
  addCustomDEX(config: IDEXAPIConfig): void {
    this.dexConfigs.set(config.protocol, config);
    
    const client = axios.create({
      baseURL: config.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.httpClients.set(config.protocol, client);
    
    logger.info(`Custom DEX added: ${config.name} (${config.protocol})`);
  }

  /**
   * Get available DEXs for a specific chain
   */
  getAvailableDEXsForChain(chainId: number): DEXProtocol[] {
    const availableDEXs: DEXProtocol[] = [];
    
    this.dexConfigs.forEach((config, protocol) => {
      if (config.isActive && config.supportedChains.includes(chainId)) {
        availableDEXs.push(protocol);
      }
    });

    return availableDEXs;
  }

  /**
   * Get all DEX information
   */
  getAllDEXInfo(): IDEXInfo[] {
    const dexInfos: IDEXInfo[] = [];
    
    this.dexConfigs.forEach((config, protocol) => {
      dexInfos.push({
        protocol,
        name: config.name,
        supportedChains: config.supportedChains,
        apiEndpoint: config.baseURL,
        isActive: config.isActive,
      });
    });

    return dexInfos;
  }

  /**
   * Test DEX API connectivity
   */
  async testDEXConnectivity(protocol: DEXProtocol): Promise<boolean> {
    try {
      const client = this.httpClients.get(protocol);
      if (!client) {
        return false;
      }

      // Simple health check
      await client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      logger.warn(`DEX connectivity test failed for ${protocol}:`, error);
      return false;
    }
  }

  /**
   * Helper method to create token from address
   */
  private createTokenFromAddress(address: string, chainId: number): IToken {
    return {
      address,
      symbol: 'UNKNOWN',
      name: 'Unknown Token',
      decimals: 18,
      chainId,
    };
  }

  /**
   * Update DEX configuration
   */
  updateDEXConfig(protocol: DEXProtocol, updates: Partial<IDEXAPIConfig>): void {
    const existingConfig = this.dexConfigs.get(protocol);
    if (existingConfig) {
      const updatedConfig = { ...existingConfig, ...updates };
      this.dexConfigs.set(protocol, updatedConfig);
      logger.info(`Updated configuration for ${protocol}`);
    }
  }

  /**
   * Enable/disable DEX
   */
  toggleDEX(protocol: DEXProtocol, isActive: boolean): void {
    this.updateDEXConfig(protocol, { isActive });
    logger.info(`${isActive ? 'Enabled' : 'Disabled'} ${protocol}`);
  }
} 