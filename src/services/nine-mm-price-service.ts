/**
 * 9MM Price Service
 * Dedicated service for fetching prices from 9mm.pro price APIs
 * Supports PulseChain, Base, and Sonic chains
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger.js';
import { IPriceData, IToken, IAPIResponse } from '../types/dex.js';
import { COMMON_TOKENS } from '../config/9mm-config.js';

export interface I9MMPriceEndpoint {
  chainId: number;
  name: string;
  baseUrl: string;
  defaultToken: string; // The token address used in the price API
}

export interface I9MMPriceResponse {
  price: string;
}

export interface I9MMPriceBatch {
  [chainId: string]: {
    price: string;
    timestamp: number;
  };
}

export class NineMMPriceService {
  private httpClient: AxiosInstance;
  private endpoints: I9MMPriceEndpoint[] = [
    {
      chainId: 369,
      name: 'PulseChain',
      baseUrl: 'https://price-api.9mm.pro/api/price/pulsechain/',
      defaultToken: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', // WPLS
    },
    {
      chainId: 8453,
      name: 'Base',
      baseUrl: 'https://price-api.9mm.pro/api/price/basechain/',
      defaultToken: '0xe290816384416fb1dB9225e176b716346dB9f9fE', // 9MM token
    },
    {
      chainId: 146,
      name: 'Sonic',
      baseUrl: 'https://price-api.9mm.pro/api/price/sonic/',
      defaultToken: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38', // WS
    },
  ];

  constructor() {
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-9MM-DEX-Server/1.0.0',
      },
    });

    // Add response interceptor for logging
    this.httpClient.interceptors.response.use(
      (response) => {
        logger.debug(`9MM Price API response: ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error(`9MM Price API error:`, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    logger.info(`9MM Price Service initialized with ${this.endpoints.length} endpoints`);
  }

  /**
   * Get token price from 9mm.pro API
   */
  async getTokenPrice(tokenAddress: string, chainId: number): Promise<IAPIResponse<IPriceData>> {
    const startTime = Date.now();

    try {
      const endpoint = this.endpoints.find(e => e.chainId === chainId);
      if (!endpoint) {
        throw new Error(`9MM Price API not available for chain ${chainId}`);
      }

      const url = `${endpoint.baseUrl}?address=${tokenAddress}`;
      
      logger.info(`Fetching 9MM price for token ${tokenAddress} on ${endpoint.name}`);

      const response = await this.httpClient.get<I9MMPriceResponse>(url);
      
      if (!response.data || !response.data.price) {
        throw new Error('Invalid response format from 9MM Price API');
      }

      const priceData = this.createPriceData(tokenAddress, chainId, response.data.price);

      return {
        success: true,
        data: priceData,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: '9mm_price_api',
          chainId,
        },
      };

    } catch (error) {
      logger.error(`9MM Price API error for ${tokenAddress} on chain ${chainId}:`, error);
      
      return {
        success: false,
        error: {
          code: '9MM_PRICE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown 9MM Price API error',
          details: { tokenAddress, chainId },
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: '9mm_price_api',
          chainId,
        },
      };
    }
  }

  /**
   * Get prices for all default tokens across all chains
   */
  async getAllDefaultPrices(): Promise<IAPIResponse<I9MMPriceBatch>> {
    const startTime = Date.now();

    try {
      const pricePromises = this.endpoints.map(async (endpoint) => {
        try {
          const response = await this.getTokenPrice(endpoint.defaultToken, endpoint.chainId);
          return {
            chainId: endpoint.chainId,
            success: response.success,
            price: response.data?.priceUSD || '0',
          };
        } catch (error) {
          logger.warn(`Failed to get price for chain ${endpoint.chainId}:`, error);
          return {
            chainId: endpoint.chainId,
            success: false,
            price: '0',
          };
        }
      });

      const results = await Promise.allSettled(pricePromises);
      const batch: I9MMPriceBatch = {};

      results.forEach((result, index) => {
        const chainId = this.endpoints[index].chainId;
        if (result.status === 'fulfilled' && result.value.success) {
          batch[chainId.toString()] = {
            price: result.value.price,
            timestamp: Date.now(),
          };
        } else {
          batch[chainId.toString()] = {
            price: '0',
            timestamp: Date.now(),
          };
        }
      });

      return {
        success: true,
        data: batch,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: '9mm_price_batch',
        },
      };

    } catch (error) {
      logger.error('9MM batch price fetch error:', error);
      
      return {
        success: false,
        error: {
          code: '9MM_BATCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown batch error',
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: '9mm_price_batch',
        },
      };
    }
  }

  /**
   * Get price comparison across all 9MM chains for a specific token
   */
  async getCrossChainPriceComparison(tokenSymbol: string): Promise<IAPIResponse<I9MMPriceBatch>> {
    const startTime = Date.now();

    try {
      const results: I9MMPriceBatch = {};
      
      for (const endpoint of this.endpoints) {
        const tokens = COMMON_TOKENS[endpoint.chainId as keyof typeof COMMON_TOKENS];
        if (tokens && tokens[tokenSymbol as keyof typeof tokens]) {
          const tokenAddress = tokens[tokenSymbol as keyof typeof tokens];
          const priceResult = await this.getTokenPrice(tokenAddress, endpoint.chainId);
          
          results[endpoint.chainId.toString()] = {
            price: priceResult.success ? priceResult.data?.priceUSD || '0' : '0',
            timestamp: Date.now(),
          };
        }
      }

      return {
        success: true,
        data: results,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: '9mm_cross_chain',
        },
      };

    } catch (error) {
      logger.error(`9MM cross-chain price comparison error for ${tokenSymbol}:`, error);
      
      return {
        success: false,
        error: {
          code: '9MM_CROSS_CHAIN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown cross-chain error',
          details: { tokenSymbol },
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: '9mm_cross_chain',
        },
      };
    }
  }

  /**
   * Get the best chain for trading a specific token based on price
   */
  async getBestChainForToken(tokenSymbol: string): Promise<IAPIResponse<{ chainId: number; price: string; name: string }>> {
    try {
      const comparison = await this.getCrossChainPriceComparison(tokenSymbol);
      
      if (!comparison.success || !comparison.data) {
        throw new Error('Failed to get cross-chain price comparison');
      }

      let bestChain: { chainId: number; price: string; name: string } | null = null;
      let bestPrice = 0;

      Object.entries(comparison.data).forEach(([chainIdStr, data]) => {
        const price = parseFloat(data.price);
        if (price > bestPrice) {
          bestPrice = price;
          const chainId = parseInt(chainIdStr);
          const endpoint = this.endpoints.find(e => e.chainId === chainId);
          bestChain = {
            chainId,
            price: data.price,
            name: endpoint?.name || `Chain ${chainId}`,
          };
        }
      });

      if (!bestChain) {
        throw new Error('No valid prices found for token');
      }

      return {
        success: true,
        data: bestChain,
        metadata: {
          executionTime: 0,
          timestamp: new Date().toISOString(),
          source: '9mm_best_chain',
        },
      };

    } catch (error) {
      logger.error(`Error finding best chain for ${tokenSymbol}:`, error);
      
      return {
        success: false,
        error: {
          code: '9MM_BEST_CHAIN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown best chain error',
          details: { tokenSymbol },
        },
        metadata: {
          executionTime: 0,
          timestamp: new Date().toISOString(),
          source: '9mm_best_chain',
        },
      };
    }
  }

  /**
   * Test connectivity to all 9MM price endpoints
   */
  async testAllEndpoints(): Promise<Record<number, boolean>> {
    const results: Record<number, boolean> = {};

    for (const endpoint of this.endpoints) {
      try {
        const response = await this.httpClient.get(
          `${endpoint.baseUrl}?address=${endpoint.defaultToken}`,
          { timeout: 5000 }
        );
        results[endpoint.chainId] = response.status === 200 && !!response.data?.price;
      } catch (error) {
        logger.warn(`9MM Price API connectivity test failed for ${endpoint.name}:`, error);
        results[endpoint.chainId] = false;
      }
    }

    return results;
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): number[] {
    return this.endpoints.map(e => e.chainId);
  }

  /**
   * Get endpoint info for a specific chain
   */
  getEndpointInfo(chainId: number): I9MMPriceEndpoint | undefined {
    return this.endpoints.find(e => e.chainId === chainId);
  }

  /**
   * Helper method to create IPriceData from API response
   */
  private createPriceData(tokenAddress: string, chainId: number, priceUSD: string): IPriceData {
    const tokens = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS];
    
    // Try to find token symbol from known tokens
    let symbol = 'UNKNOWN';
    let name = 'Unknown Token';
    
    if (tokens) {
      for (const [tokenSymbol, address] of Object.entries(tokens)) {
        if (address.toLowerCase() === tokenAddress.toLowerCase()) {
          symbol = tokenSymbol;
          name = tokenSymbol === 'WETH' ? 'Wrapped Ether' :
                 tokenSymbol === 'WPLS' ? 'Wrapped PLS' :
                 tokenSymbol === 'WS' ? 'Wrapped Sonic' :
                 tokenSymbol === '9MM' ? '9MM Token' :
                 tokenSymbol === 'USDC' ? 'USD Coin' :
                 tokenSymbol === 'USDT' ? 'Tether USD' :
                 tokenSymbol;
          break;
        }
      }
    }

    const token: IToken = {
      address: tokenAddress,
      symbol,
      name,
      decimals: 18, // Default, could be fetched from contract
      chainId,
    };

    return {
      token,
      priceUSD,
      priceChange24h: 0, // 9MM API doesn't provide 24h change
      volume24h: '0', // 9MM API doesn't provide volume
      marketCap: '0', // 9MM API doesn't provide market cap
      timestamp: Date.now(),
      source: '9mm_price_api',
      chainId,
    };
  }
}

export const nineMMPriceService = new NineMMPriceService(); 