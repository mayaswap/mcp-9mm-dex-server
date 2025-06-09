/**
 * MCP Server
 * Enhanced MCP server with GraphQL price feeds and multi-DEX aggregation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../utils/logger';
import { config } from '../config/environment';
import { GraphQLPriceFeedService } from '../services/graphql-price-feed';
import { DEXAggregatorService } from '../services/dex-aggregator';
import { DEXProtocol } from '../types/dex';
import { allTools, handleAllTools } from './tools/nine-mm-tools';
import { nineMMDEXTools, handle9MMDEXTool } from './tools/nine-mm-dex-tools';

export class MCPServer {
  private server: Server;
  private isInitialized: boolean = false;
  private priceFeedService: GraphQLPriceFeedService;
  private dexAggregatorService: DEXAggregatorService;

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-evm-dex-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    // Initialize services
    this.priceFeedService = new GraphQLPriceFeedService();
    this.dexAggregatorService = new DEXAggregatorService();
  }

  /**
   * Initialize the MCP server with enhanced tools and services
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing Enhanced MCP EVM DEX server...');

      // Set up request handlers
      this.setupToolHandlers();
      this.setupResourceHandlers();
      this.setupPromptHandlers();

      this.isInitialized = true;
      logger.info('✅ Enhanced MCP EVM DEX server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MCP server:', error);
      throw error;
    }
  }

  /**
   * Set up enhanced tool handlers for EVM DEX operations
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // 9MM DEX and Wallet Tools
          ...allTools,
          // 9MM DEX Aggregator Tools
          ...nineMMDEXTools,
          // Original aggregation tools
          {
            name: 'get_token_price_graphql',
            description: 'Get real-time token price from GraphQL endpoints (The Graph)',
            inputSchema: {
              type: 'object',
              properties: {
                tokenAddress: {
                  type: 'string',
                  description: 'Token contract address',
                },
                chainId: {
                  type: 'number',
                  description: 'EVM chain ID (1=Ethereum, 137=Polygon, 56=BSC, etc.)',
                },
              },
              required: ['tokenAddress', 'chainId'],
            },
          },
          {
            name: 'get_multiple_token_prices',
            description: 'Get prices for multiple tokens in batch from GraphQL',
            inputSchema: {
              type: 'object',
              properties: {
                tokens: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      address: { type: 'string' },
                      chainId: { type: 'number' },
                    },
                    required: ['address', 'chainId'],
                  },
                  description: 'Array of tokens to get prices for',
                },
              },
              required: ['tokens'],
            },
          },
          {
            name: 'get_best_swap_quote',
            description: 'Get the best swap quote across all available DEXs',
            inputSchema: {
              type: 'object',
              properties: {
                fromToken: {
                  type: 'string',
                  description: 'From token contract address',
                },
                toToken: {
                  type: 'string',
                  description: 'To token contract address',
                },
                amount: {
                  type: 'string',
                  description: 'Amount to swap (in wei/smallest unit)',
                },
                slippage: {
                  type: 'number',
                  description: 'Slippage tolerance (e.g., 0.5 for 0.5%)',
                  minimum: 0.1,
                  maximum: 50,
                },
                chainId: {
                  type: 'number',
                  description: 'EVM chain ID',
                },
                userAddress: {
                  type: 'string',
                  description: 'User wallet address',
                },
              },
              required: ['fromToken', 'toToken', 'amount', 'slippage', 'chainId', 'userAddress'],
            },
          },
          {
            name: 'get_quote_from_specific_dex',
            description: 'Get swap quote from a specific DEX protocol',
            inputSchema: {
              type: 'object',
              properties: {
                dexProtocol: {
                  type: 'string',
                  enum: Object.values(DEXProtocol),
                  description: 'Specific DEX protocol to use',
                },
                fromToken: { type: 'string' },
                toToken: { type: 'string' },
                amount: { type: 'string' },
                slippage: { type: 'number' },
                chainId: { type: 'number' },
                userAddress: { type: 'string' },
              },
              required: ['dexProtocol', 'fromToken', 'toToken', 'amount', 'slippage', 'chainId', 'userAddress'],
            },
          },
          {
            name: 'get_available_dexs',
            description: 'Get all available DEXs for a specific chain',
            inputSchema: {
              type: 'object',
              properties: {
                chainId: {
                  type: 'number',
                  description: 'EVM chain ID (optional - returns all if not specified)',
                },
              },
            },
          },
          {
            name: 'add_custom_dex',
            description: 'Add a custom DEX configuration for API integration',
            inputSchema: {
              type: 'object',
              properties: {
                protocol: { type: 'string' },
                name: { type: 'string' },
                baseURL: { type: 'string' },
                supportedChains: {
                  type: 'array',
                  items: { type: 'number' },
                },
                endpoints: {
                  type: 'object',
                  properties: {
                    quote: { type: 'string' },
                    swap: { type: 'string' },
                    pools: { type: 'string' },
                  },
                },
                apiKey: { type: 'string', description: 'Optional API key' },
              },
              required: ['protocol', 'name', 'baseURL', 'supportedChains'],
            },
          },
          {
            name: 'get_chain_info',
            description: 'Get information about supported EVM chains',
            inputSchema: {
              type: 'object',
              properties: {
                chainId: {
                  type: 'number',
                  description: 'Optional chain ID to get specific chain info',
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Check if it's a 9MM or wallet tool first
        if (allTools.some(tool => tool.name === name)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(await handleAllTools(name, args), null, 2),
              },
            ],
          };
        }

        // Check if it's a 9MM DEX aggregator tool
        if (nineMMDEXTools.some(tool => tool.name === name)) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(await handle9MMDEXTool(name, args), null, 2),
              },
            ],
          };
        }

        // Handle original aggregation tools
        switch (name) {
          case 'get_token_price_graphql':
            return await this.handleGetTokenPriceGraphQL(args);
          
          case 'get_multiple_token_prices':
            return await this.handleGetMultipleTokenPrices(args);
          
          case 'get_best_swap_quote':
            return await this.handleGetBestSwapQuote(args);
          
          case 'get_quote_from_specific_dex':
            return await this.handleGetQuoteFromSpecificDEX(args);
          
          case 'get_available_dexs':
            return await this.handleGetAvailableDEXs(args);
          
          case 'add_custom_dex':
            return await this.handleAddCustomDEX(args);
          
          case 'get_chain_info':
            return await this.handleGetChainInfo(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool execution error for ${name}:`, error);
        return {
          success: false,
          error: {
            code: 'TOOL_EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
    });
  }

  /**
   * Set up resource handlers for real-time EVM data
   */
  private setupResourceHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'market_data://evm_live_prices',
            name: 'EVM Live Token Prices',
            description: 'Real-time token prices across EVM chains',
            mimeType: 'application/json',
          },
          {
            uri: 'analytics://evm_chain_stats',
            name: 'EVM Chain Statistics',
            description: 'Network statistics for supported EVM chains',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'market_data://evm_live_prices':
            return await this.handleLivePricesResource();
          
          case 'analytics://evm_chain_stats':
            return await this.handleChainStatsResource();

          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        logger.error(`Resource read error for ${uri}:`, error);
        throw error;
      }
    });
  }

  /**
   * Set up prompt handlers for EVM analysis templates
   */
  private setupPromptHandlers(): void {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'evm_trading_analysis',
            description: 'Analyze EVM trading opportunities and provide insights',
            arguments: [
              {
                name: 'tokenPair',
                description: 'Token pair to analyze (e.g., ETH/USDC)',
                required: true,
              },
              {
                name: 'chainId',
                description: 'EVM chain ID to focus analysis on',
                required: true,
              },
            ],
          },
        ],
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'evm_trading_analysis':
            return await this.handleTradingAnalysisPrompt(args);

          default:
            throw new Error(`Unknown prompt: ${name}`);
        }
      } catch (error) {
        logger.error(`Prompt generation error for ${name}:`, error);
        throw error;
      }
    });
  }

  /**
   * Handle GraphQL token price fetch
   */
  private async handleGetTokenPriceGraphQL(args: any): Promise<any> {
    const { tokenAddress, chainId } = args;
    
    logger.info(`Getting GraphQL price for token ${tokenAddress} on chain ${chainId}`);
    
    const result = await this.priceFeedService.getTokenPrice(tokenAddress, chainId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: {
        ...result.metadata,
        source: 'graphql_price_feed',
      },
    };
  }

  /**
   * Handle multiple token prices fetch
   */
  private async handleGetMultipleTokenPrices(args: any): Promise<any> {
    const { tokens } = args;
    
    logger.info(`Getting prices for ${tokens.length} tokens`);
    
    const result = await this.priceFeedService.getMultipleTokenPrices(tokens);
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * Handle best swap quote across all DEXs
   */
  private async handleGetBestSwapQuote(args: any): Promise<any> {
    const swapParams = {
      fromToken: args.fromToken,
      toToken: args.toToken,
      amount: args.amount,
      slippage: args.slippage,
      chainId: args.chainId,
      userAddress: args.userAddress,
      deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      dexProtocol: DEXProtocol.ONEINCH, // This will be overridden by aggregator
    };
    
    logger.info(`Getting best quote for ${args.fromToken} -> ${args.toToken} on chain ${args.chainId}`);
    
    const result = await this.dexAggregatorService.getBestQuote(swapParams);
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * Handle quote from specific DEX
   */
  private async handleGetQuoteFromSpecificDEX(args: any): Promise<any> {
    const swapParams = {
      fromToken: args.fromToken,
      toToken: args.toToken,
      amount: args.amount,
      slippage: args.slippage,
      chainId: args.chainId,
      userAddress: args.userAddress,
      deadline: Math.floor(Date.now() / 1000) + 1800,
      dexProtocol: args.dexProtocol as DEXProtocol,
    };
    
    logger.info(`Getting quote from ${args.dexProtocol} for ${args.fromToken} -> ${args.toToken}`);
    
    const result = await this.dexAggregatorService.getQuoteFromDEX(args.dexProtocol, swapParams);
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: result.metadata,
    };
  }

  /**
   * Handle available DEXs query
   */
  private async handleGetAvailableDEXs(args: any): Promise<any> {
    const { chainId } = args;
    
    if (chainId) {
      const availableDEXs = this.dexAggregatorService.getAvailableDEXsForChain(chainId);
      return {
        success: true,
        data: {
          chainId,
          availableDEXs,
          count: availableDEXs.length,
        },
        metadata: {
          executionTime: 10,
          timestamp: new Date().toISOString(),
          source: 'dex_aggregator',
        },
      };
    } else {
      const allDEXs = this.dexAggregatorService.getAllDEXInfo();
      return {
        success: true,
        data: {
          allDEXs,
          totalDEXs: allDEXs.length,
        },
        metadata: {
          executionTime: 10,
          timestamp: new Date().toISOString(),
          source: 'dex_aggregator',
        },
      };
    }
  }

  /**
   * Handle adding custom DEX
   */
  private async handleAddCustomDEX(args: any): Promise<any> {
    const dexConfig = {
      protocol: args.protocol as DEXProtocol,
      name: args.name,
      baseURL: args.baseURL,
      supportedChains: args.supportedChains,
      endpoints: args.endpoints,
      apiKey: args.apiKey,
      isActive: true,
    };
    
    this.dexAggregatorService.addCustomDEX(dexConfig);
    
    return {
      success: true,
      data: {
        message: `Custom DEX ${args.name} added successfully`,
        dexConfig,
      },
      metadata: {
        executionTime: 10,
        timestamp: new Date().toISOString(),
        source: 'dex_aggregator',
      },
    };
  }

  /**
   * Handle get chain info tool
   */
  private async handleGetChainInfo(args: any): Promise<any> {
    const { chainId } = args;
    
    if (chainId) {
      // Return specific chain info
      const chainInfo = Object.values(config.evmNetworks).find(
        network => network.chainId === chainId
      );
      
      if (!chainInfo) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }
      
      return {
        success: true,
        data: chainInfo,
        metadata: {
          executionTime: 10,
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      // Return all supported chains
      return {
        success: true,
        data: {
          supportedChains: Object.values(config.evmNetworks),
          totalChains: Object.keys(config.evmNetworks).length,
        },
        metadata: {
          executionTime: 10,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Handle live prices resource
   */
  private async handleLivePricesResource(): Promise<any> {
    // TODO: Implement actual live price data fetching
    return {
      contents: [
        {
          uri: 'market_data://evm_live_prices',
          mimeType: 'application/json',
          text: JSON.stringify({
            prices: {
              ethereum: { ETH: 2400.50, USDC: 1.00 },
              polygon: { MATIC: 0.85, USDC: 1.00 },
              bsc: { BNB: 285.30, USDT: 1.00 },
            },
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  /**
   * Handle chain stats resource
   */
  private async handleChainStatsResource(): Promise<any> {
    // TODO: Implement actual chain statistics fetching
    return {
      contents: [
        {
          uri: 'analytics://evm_chain_stats',
          mimeType: 'application/json',
          text: JSON.stringify({
            chains: Object.values(config.evmNetworks).map(chain => ({
              ...chain,
              gasPrice: '20', // Placeholder
              blockNumber: 18500000, // Placeholder
              status: 'healthy',
            })),
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    };
  }

  /**
   * Handle trading analysis prompt
   */
  private async handleTradingAnalysisPrompt(args: any): Promise<any> {
    const { tokenPair, chainId } = args;
    
    const prompt = `
    Analyze the trading opportunities for ${tokenPair} on EVM chain ${chainId}.
    
    Please provide:
    1. Current market conditions and price trends
    2. Liquidity analysis across major DEXs
    3. Gas cost considerations for trading
    4. Risk assessment and recommendations
    5. Optimal entry/exit strategies
    
    Consider the following factors:
    - Recent price movements and volume
    - DEX liquidity pools and slippage
    - Network congestion and gas prices
    - Market sentiment and technical indicators
    `;

    return {
      description: `EVM Trading Analysis for ${tokenPair} on Chain ${chainId}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: prompt.trim(),
          },
        },
      ],
    };
  }

  /**
   * Shutdown the MCP server gracefully
   */
  async shutdown(): Promise<void> {
    if (this.isInitialized) {
      logger.info('Shutting down MCP EVM DEX server...');
      // Add cleanup logic here if needed
      this.isInitialized = false;
      logger.info('✅ MCP EVM DEX server shutdown complete');
    }
  }

  /**
   * Get server status
   */
  getStatus(): { initialized: boolean; uptime: number } {
    return {
      initialized: this.isInitialized,
      uptime: process.uptime(),
    };
  }
} 