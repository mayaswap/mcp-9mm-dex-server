#!/usr/bin/env node

/**
 * 9MM Multi-Chain DEX MCP Server
 * Supports Base, PulseChain, and Sonic networks
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { allTools, handleToolCall } from './mcp/tools/index.js';
import { logger } from './utils/logger.js';
import { getAllSupported9MMChains } from './config/9mm-config.js';

class NineMMServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: '9mm-dex-server',
        version: '1.0.0',
        description: 'Multi-chain 9MM DEX MCP server supporting Base, PulseChain, and Sonic',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: allTools,
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Handle all available tools through central handler
        const result = await handleToolCall(name, args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        logger.error(`Tool execution error (${name}):`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const chains = getAllSupported9MMChains();
      
      return {
        resources: [
          {
            uri: '9mm://chains',
            mimeType: 'application/json',
            name: '9MM Supported Chains',
            description: 'List of all chains where 9MM is deployed',
          },
          {
            uri: '9mm://fees',
            mimeType: 'application/json',
            name: '9MM Fee Structure',
            description: 'Fee information for 9MM V2, V3, and Aggregator',
          },
          ...chains.map(chain => ({
            uri: `9mm://chain/${chain.chainId}`,
            mimeType: 'application/json',
            name: `9MM ${chain.name} Info`,
            description: `Contract addresses and configuration for 9MM on ${chain.name}`,
          })),
        ],
      };
    });

    // Handle resource reading
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        if (uri === '9mm://chains') {
          const chains = getAllSupported9MMChains();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  supported_chains: chains.map(chain => ({
                    chainId: chain.chainId,
                    name: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    blockExplorer: chain.blockExplorer,
                    features: chain.features,
                    gasSettings: chain.gasSettings,
                  })),
                  total: chains.length,
                }, null, 2),
              },
            ],
          };
        }

        if (uri === '9mm://fees') {
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  fee_structure: {
                    v2: {
                      rate: 0.0017,
                      description: '0.17% trading fee (lower than standard 0.3%)',
                      distribution: 'Fees auto-reinvested into liquidity positions',
                    },
                    v3: {
                      low_fee: 0.0005,
                      medium_fee: 0.003,
                      high_fee: 0.01,
                      description: 'Variable fees based on price range concentration',
                    },
                    aggregator: {
                      rate: 0.001,
                      description: '0.1% aggregator fee for best price routing',
                    },
                  },
                  revenue_sharing: {
                    token_holders: '50% of protocol fees distributed to 9MM token holders',
                    nft_holders: '96% to OG NFT holders, 4% to PUSSY 404 holders',
                    distribution_date: '9th of each month',
                  },
                }, null, 2),
              },
            ],
          };
        }

        if (uri.startsWith('9mm://chain/')) {
          const chainId = parseInt(uri.split('/').pop() || '0');
          const chains = getAllSupported9MMChains();
          const chain = chains.find(c => c.chainId === chainId);
          
          if (!chain) {
            throw new McpError(ErrorCode.InvalidRequest, `Chain ${chainId} not supported`);
          }

          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify({
                  chain_info: {
                    chainId: chain.chainId,
                    name: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrl: chain.rpcUrl,
                    blockExplorer: chain.blockExplorer,
                    contracts: chain.contracts,
                    features: chain.features,
                    gasSettings: chain.gasSettings,
                  },
                  usage_tips: [
                    `${chain.name} offers ${chain.gasSettings.gasPrice} gwei gas prices`,
                    'Use MetaMask or WalletConnect for transactions',
                    'Always check slippage before large trades',
                    'Consider gas costs for small trades',
                  ],
                }, null, 2),
              },
            ],
          };
        }

        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
      } catch (error) {
        logger.error(`Resource reading error (${uri}):`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Resource reading failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: '9mm_trading_analysis',
            description: 'Analyze trading opportunities across 9MM chains',
            arguments: [
              {
                name: 'trading_pair',
                description: 'Token pair to analyze (e.g., USDC/WETH)',
                required: true,
              },
              {
                name: 'amount',
                description: 'Amount to trade',
                required: true,
              },
            ],
          },
          {
            name: '9mm_liquidity_strategy',
            description: 'Generate liquidity provision strategy for 9MM pools',
            arguments: [
              {
                name: 'token_a',
                description: 'First token in the pair',
                required: true,
              },
              {
                name: 'token_b',
                description: 'Second token in the pair',
                required: true,
              },
              {
                name: 'budget',
                description: 'Available budget for liquidity',
                required: true,
              },
            ],
          },
          {
            name: '9mm_chain_comparison',
            description: 'Compare 9MM deployments across different chains',
            arguments: [
              {
                name: 'metric',
                description: 'Comparison metric (fees, liquidity, volume)',
                required: true,
              },
            ],
          },
        ],
      };
    });

    // Handle prompt execution
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === '9mm_trading_analysis') {
          const { trading_pair, amount } = args || {};
          return {
            description: 'Trading analysis for 9MM DEX',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Analyze the ${trading_pair} trading pair on 9MM DEX across Base, PulseChain, and Sonic networks. 

Consider:
- Price differences between chains
- Liquidity depth on each chain
- Gas costs vs trade size (${amount})
- Slippage impact
- Best execution strategy

Use the following tools to gather data:
1. compare_9mm_prices - to find the best rates
2. get_9mm_pool_info - to check liquidity
3. get_9mm_best_chain - to get recommendations

Provide a comprehensive analysis with actionable trading recommendations.`,
                },
              },
            ],
          };
        }

        if (name === '9mm_liquidity_strategy') {
          const { token_a, token_b, budget } = args || {};
          return {
            description: 'Liquidity provision strategy for 9MM',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Create a liquidity provision strategy for the ${token_a}/${token_b} pair on 9MM DEX with a budget of ${budget}.

Analysis needed:
- Pool performance across Base, PulseChain, and Sonic
- Impermanent loss risk assessment
- Expected APR and fee generation
- Optimal capital allocation between chains
- Entry and exit strategies

Use these tools:
1. get_9mm_pool_info - for each chain's pool data
2. get_9mm_supported_chains - to understand chain differences
3. compare_9mm_prices - to assess price stability

Provide specific recommendations on which chain(s) to provide liquidity on and why.`,
                },
              },
            ],
          };
        }

        if (name === '9mm_chain_comparison') {
          const { metric } = args || {};
          return {
            description: 'Comparison of 9MM across different chains',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Compare 9MM DEX deployments across Base, PulseChain, and Sonic, focusing on ${metric}.

Provide detailed comparison covering:
- Network characteristics (speed, cost, reliability)
- 9MM-specific features available on each chain
- User adoption and trading volume
- Developer ecosystem and tooling
- Future roadmap and potential

Use these tools:
1. get_9mm_supported_chains - for chain details
2. get_9mm_common_tokens - for available tokens
3. Compare any relevant pool data

Conclude with recommendations for different user types (traders, LPs, developers).`,
                },
              },
            ],
          };
        }

        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
      } catch (error) {
        logger.error(`Prompt execution error (${name}):`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Prompt execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('9MM Multi-Chain DEX MCP Server running on stdio');
    logger.info('Supported chains: Base (8453), PulseChain (369), Sonic (146)');
  }
}

// Run the server
const server = new NineMMServer();
server.run().catch((error) => {
  logger.error('Server failed to start:', error);
  process.exit(1);
}); 