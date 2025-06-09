/**
 * MCP Tools Index
 * Central registry for all available MCP tools
 * Updated to use auto-generated user wallet tools instead of external wallet connections
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

// Import all tool categories
import { nineMMTools, handle9MMTool } from './nine-mm-tools.js';
import { userWalletTools, handleUserWalletTool } from './user-wallet-tools.js';

// Export all available tools (removed old external wallet tools)
export const allTools: Tool[] = [
  // 9MM DEX Tools
  ...nineMMTools,
  // User Auto-Generated Wallet Tools (replaces external wallet connection)
  ...userWalletTools,
];

// Central tool handler
export async function handleToolCall(name: string, args: any): Promise<any> {
  // Handle 9MM DEX tools
  if (nineMMTools.some(tool => tool.name === name)) {
    return await handle9MMTool(name, args);
  }

  // Handle user wallet tools
  if (userWalletTools.some(tool => tool.name === name)) {
    return await handleUserWalletTool(name, args);
  }

  // Tool not found
  return {
    success: false,
    error: `Unknown tool: ${name}. Available tools: ${allTools.map(t => t.name).join(', ')}`,
  };
}

// Export tool categories for selective imports
export {
  nineMMTools,
  userWalletTools,
  handle9MMTool,
  handleUserWalletTool,
};

// Tool registry information
export const toolRegistry = {
  totalTools: allTools.length,
  categories: {
    'DEX Trading': nineMMTools.length,
    'Auto-Generated Wallets': userWalletTools.length,
  },
  securityFeatures: [
    'Auto-generated wallets for each user',
    'No external wallet connections required',
    'Private key provided directly to user',
    'Session-based authentication',
    'Automatic wallet initialization for trading',
  ],
  removedFeatures: [
    'MetaMask connection',
    'WalletConnect integration',
    'External wallet imports',
    'Multi-wallet support',
  ],
}; 