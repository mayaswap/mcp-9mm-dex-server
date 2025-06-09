/**
 * GraphQL Price Feed Service
 * Service for fetching token prices from GraphQL endpoints (The Graph, etc.)
 */

import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client/core';
import { logger } from '../utils/logger.js';
import { IPriceData, IToken, IGraphQLPriceQuery, IAPIResponse } from '../types/dex.js';

interface IGraphQLEndpoint {
  chainId: number;
  name: string;
  url: string;
  type: 'thegraph' | 'custom';
}

export class GraphQLPriceFeedService {
  private clients: Map<number, ApolloClient<any>> = new Map();
  private endpoints: IGraphQLEndpoint[] = [
    {
      chainId: 1,
      name: 'Uniswap V3 Ethereum',
      url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
      type: 'thegraph',
    },
    {
      chainId: 137,
      name: 'Uniswap V3 Polygon',
      url: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
      type: 'thegraph',
    },
    {
      chainId: 56,
      name: 'PancakeSwap BSC',
      url: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange',
      type: 'thegraph',
    },
    {
      chainId: 42161,
      name: 'Uniswap V3 Arbitrum',
      url: 'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal',
      type: 'thegraph',
    },
    {
      chainId: 10,
      name: 'Uniswap V3 Optimism',
      url: 'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',
      type: 'thegraph',
    },
    {
      chainId: 8453,
      name: 'PancakeSwap V3 Base',
      url: 'https://gateway.thegraph.com/api/2e49631ace452362bcf744c2c94ca145/subgraphs/id/BnAEbKRkCW2oKKggWn8AKP7NVQhwJTaxMMfio5ngCZRV',
      type: 'thegraph',
    },
    {
      chainId: 369,
      name: '9MM DEX V3 PulseChain',
      url: 'https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest',
      type: 'custom',
    },
    {
      chainId: 146,
      name: '9MM DEX V3 Sonic',
      url: 'https://gateway.thegraph.com/api/2e49631ace452362bcf744c2c94ca145/subgraphs/id/EatYuv9ktFGrSDGRw9cNwkKXweCX52hRAiamGXQb29Ah',
      type: 'thegraph',
    },
  ];

  constructor() {
    this.initializeClients();
  }

  /**
   * Initialize Apollo GraphQL clients for each endpoint
   */
  private initializeClients(): void {
    this.endpoints.forEach(endpoint => {
      const httpLink = createHttpLink({
        uri: endpoint.url,
        fetch: fetch,
      });

      const client = new ApolloClient({
        link: httpLink,
        cache: new InMemoryCache(),
        defaultOptions: {
          watchQuery: {
            errorPolicy: 'ignore',
          },
          query: {
            errorPolicy: 'all',
          },
        },
      });

      this.clients.set(endpoint.chainId, client);
      logger.info(`GraphQL client initialized for ${endpoint.name} (Chain ${endpoint.chainId})`);
    });
  }

  /**
   * Get token price from GraphQL endpoint
   */
  async getTokenPrice(tokenAddress: string, chainId: number): Promise<IAPIResponse<IPriceData>> {
    const startTime = Date.now();
    
    try {
      const client = this.clients.get(chainId);
      if (!client) {
        throw new Error(`No GraphQL endpoint configured for chain ${chainId}`);
      }

      const query = this.buildPriceQuery(chainId);
      const variables = {
        tokenAddress: tokenAddress.toLowerCase(),
      };

      logger.info(`Fetching price for token ${tokenAddress} on chain ${chainId}`);

      const result = await client.query({
        query: gql(query.query),
        variables: query.variables || variables,
        fetchPolicy: 'cache-first',
      });

      const priceData = this.parsePriceData(result.data, tokenAddress, chainId);

      return {
        success: true,
        data: priceData,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: 'graphql',
          chainId,
        },
      };

    } catch (error) {
      logger.error(`GraphQL price fetch error for ${tokenAddress} on chain ${chainId}:`, error);
      
      return {
        success: false,
        error: {
          code: 'GRAPHQL_PRICE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown GraphQL error',
          details: { tokenAddress, chainId },
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: 'graphql',
          chainId,
        },
      };
    }
  }

  /**
   * Get multiple token prices in batch
   */
  async getMultipleTokenPrices(
    tokens: Array<{ address: string; chainId: number }>
  ): Promise<IAPIResponse<IPriceData[]>> {
    const startTime = Date.now();
    
    try {
      const pricePromises = tokens.map(token => 
        this.getTokenPrice(token.address, token.chainId)
      );

      const results = await Promise.allSettled(pricePromises);
      const successfulPrices: IPriceData[] = [];
      const errors: any[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          if (result.value.data) {
            successfulPrices.push(result.value.data);
          }
        } else {
          errors.push({
            token: tokens[index],
            error: result.status === 'rejected' ? result.reason : result.value.error,
          });
        }
      });

      return {
        success: true,
        data: successfulPrices,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: 'graphql_batch',
        },
      };

    } catch (error) {
      logger.error('Batch GraphQL price fetch error:', error);
      
      return {
        success: false,
        error: {
          code: 'GRAPHQL_BATCH_ERROR',
          message: error instanceof Error ? error.message : 'Unknown batch error',
        },
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          source: 'graphql_batch',
        },
      };
    }
  }

  /**
   * Build GraphQL query based on chain and protocol
   */
  private buildPriceQuery(chainId: number): IGraphQLPriceQuery {
    // Uniswap V3, PancakeSwap V3, and 9MM DEX V3 query (Ethereum, Polygon, Arbitrum, Optimism, Base, PulseChain, Sonic)
    if ([1, 137, 42161, 10, 8453, 369, 146].includes(chainId)) {
      return {
        query: `
          query GetTokenPrice($tokenAddress: String!) {
            token(id: $tokenAddress) {
              id
              symbol
              name
              decimals
              derivedETH
              volume
              volumeUSD
              totalValueLocked
              totalValueLockedUSD
              tokenDayData(first: 1, orderBy: date, orderDirection: desc) {
                priceUSD
                volume
                volumeUSD
                date
              }
            }
            bundle(id: "1") {
              ethPriceUSD
            }
          }
        `,
        variables: {},
        endpoint: this.endpoints.find(e => e.chainId === chainId)?.url || '',
      };
    }

    // PancakeSwap query (BSC)
    if (chainId === 56) {
      return {
        query: `
          query GetTokenPrice($tokenAddress: String!) {
            token(id: $tokenAddress) {
              id
              symbol
              name
              decimals
              derivedBNB
              totalLiquidity
              tradeVolume
              tradeVolumeUSD
              totalTransactions
              tokenDayData(first: 1, orderBy: date, orderDirection: desc) {
                priceUSD
                dailyVolumeToken
                dailyVolumeUSD
                date
              }
            }
            bundle(id: "1") {
              bnbPrice
            }
          }
        `,
        variables: {},
        endpoint: this.endpoints.find(e => e.chainId === chainId)?.url || '',
      };
    }

    // Default query
    return {
      query: `
        query GetTokenPrice($tokenAddress: String!) {
          token(id: $tokenAddress) {
            id
            symbol
            name
            decimals
            totalSupply
          }
        }
      `,
      variables: {},
      endpoint: this.endpoints.find(e => e.chainId === chainId)?.url || '',
    };
  }

  /**
   * Parse GraphQL response to IPriceData
   */
  private parsePriceData(data: any, tokenAddress: string, chainId: number): IPriceData {
    const token = data.token;
    const bundle = data.bundle;
    
    if (!token) {
      throw new Error(`Token ${tokenAddress} not found in GraphQL response`);
    }

    // Calculate USD price based on chain
    let priceUSD = '0';
    let volume24h = '0';
    let priceChange24h = 0;

    if (token.tokenDayData && token.tokenDayData.length > 0) {
      const dayData = token.tokenDayData[0];
      priceUSD = dayData.priceUSD || '0';
      volume24h = dayData.volumeUSD || dayData.dailyVolumeUSD || '0';
    } else if (token.derivedETH && bundle?.ethPriceUSD) {
      priceUSD = (parseFloat(token.derivedETH) * parseFloat(bundle.ethPriceUSD)).toString();
    } else if (token.derivedBNB && bundle?.bnbPrice) {
      priceUSD = (parseFloat(token.derivedBNB) * parseFloat(bundle.bnbPrice)).toString();
    }

    const tokenInfo: IToken = {
      address: tokenAddress,
      symbol: token.symbol || 'UNKNOWN',
      name: token.name || 'Unknown Token',
      decimals: parseInt(token.decimals) || 18,
      chainId,
    };

    return {
      token: tokenInfo,
      priceUSD,
      priceChange24h,
      volume24h,
      marketCap: token.totalValueLockedUSD || token.totalLiquidity || '0',
      timestamp: Date.now(),
      source: 'thegraph',
      chainId,
    };
  }

  /**
   * Add custom GraphQL endpoint
   */
  addCustomEndpoint(endpoint: IGraphQLEndpoint): void {
    this.endpoints.push(endpoint);
    
    const httpLink = createHttpLink({
      uri: endpoint.url,
      fetch: fetch,
    });

    const client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
    });

    this.clients.set(endpoint.chainId, client);
    logger.info(`Custom GraphQL endpoint added for ${endpoint.name} (Chain ${endpoint.chainId})`);
  }

  /**
   * Get available endpoints
   */
  getAvailableEndpoints(): IGraphQLEndpoint[] {
    return this.endpoints;
  }

  /**
   * Test GraphQL endpoint connectivity
   */
  async testEndpoint(chainId: number): Promise<boolean> {
    try {
      const client = this.clients.get(chainId);
      if (!client) {
        return false;
      }

      // Simple test query
      await client.query({
        query: gql`
          query TestQuery {
            _meta {
              block {
                number
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      });

      return true;
    } catch (error) {
      logger.error(`GraphQL endpoint test failed for chain ${chainId}:`, error);
      return false;
    }
  }
} 