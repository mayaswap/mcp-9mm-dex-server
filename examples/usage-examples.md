# MCP EVM DEX Server - Usage Examples

This document provides comprehensive examples of how to use the enhanced MCP EVM DEX server with GraphQL price feeds and multi-DEX aggregation.

## 🚀 Getting Started

First, ensure your server is running with the new services:

```bash
npm run dev
```

## 📊 GraphQL Price Feed Examples

### Get Single Token Price

```javascript
// Get ETH price from The Graph
const ethPrice = await mcpClient.callTool('get_token_price_graphql', {
  tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  chainId: 1 // Ethereum
});

console.log(`ETH Price: $${ethPrice.data.priceUSD}`);
// Output: ETH Price: $2450.75
```

### Batch Token Price Queries

```javascript
// Get prices for multiple tokens across different chains
const multiPrices = await mcpClient.callTool('get_multiple_token_prices', {
  tokens: [
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1 },   // WETH on Ethereum
    { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', chainId: 137 }, // WMATIC on Polygon
    { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', chainId: 56 },  // WBNB on BSC
  ]
});

multiPrices.data.forEach(token => {
  console.log(`${token.token.symbol}: $${token.priceUSD} (Chain: ${token.chainId})`);
});
```

## 🔄 DEX Aggregation Examples

### Find Best Swap Rate

```javascript
// Find the best rate across all available DEXs
const bestQuote = await mcpClient.callTool('get_best_swap_quote', {
  fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  toToken: '0xA0b86a33E6441c7eca3cf51d4ae1ee9F8e9Cf8a',   // USDC
  amount: '1000000000000000000', // 1 ETH in wei
  slippage: 0.5, // 0.5%
  chainId: 1,
  userAddress: '0x742d35Cc6634C0532925a3b8D214839A2d11A6e5'
});

console.log('Best DEX:', bestQuote.data.recommendedDEX);
console.log('Output Amount:', bestQuote.data.bestQuote.toAmount);
console.log('You save:', bestQuote.data.savings.amount, 'USDC');
console.log('Savings percentage:', bestQuote.data.savings.percentage.toFixed(2) + '%');
```

### Compare Specific DEX

```javascript
// Get quote from specific DEX (1inch)
const oneInchQuote = await mcpClient.callTool('get_quote_from_specific_dex', {
  dexProtocol: '1inch',
  fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  toToken: '0xA0b86a33E6441c7eca3cf51d4ae1ee9F8e9Cf8a',
  amount: '1000000000000000000',
  slippage: 0.5,
  chainId: 1,
  userAddress: '0x742d35Cc6634C0532925a3b8D214839A2d11A6e5'
});

console.log('1inch Quote:', oneInchQuote.data.toAmount);
console.log('Gas Estimate:', oneInchQuote.data.gasEstimate);
```

## 🔧 Custom DEX Integration

### Add Custom DEX

```javascript
// Add Trader Joe (Avalanche DEX)
const customDex = await mcpClient.callTool('add_custom_dex', {
  protocol: 'trader_joe',
  name: 'Trader Joe',
  baseURL: 'https://api.traderjoe.xyz',
  supportedChains: [43114], // Avalanche C-Chain
  endpoints: {
    quote: '/v1/quote',
    swap: '/v1/swap',
    pools: '/v1/pools'
  },
  apiKey: 'optional-api-key-if-required'
});

console.log('Custom DEX added:', customDex.data.message);
```

### Check Available DEXs

```javascript
// Get all available DEXs for Ethereum
const ethDEXs = await mcpClient.callTool('get_available_dexs', {
  chainId: 1
});

console.log('Available DEXs on Ethereum:');
ethDEXs.data.availableDEXs.forEach(dex => {
  console.log(`- ${dex}`);
});

// Get all supported DEXs across all chains
const allDEXs = await mcpClient.callTool('get_available_dexs', {});
console.log('Total DEX protocols:', allDEXs.data.totalDEXs);
```

## 📊 Real-Time Resources

### Access Live Price Data

```javascript
// Read GraphQL live prices resource
const livePrices = await mcpClient.readResource('market_data://graphql_live_prices');
const priceData = JSON.parse(livePrices.contents[0].text);

console.log('Live Prices from GraphQL:');
priceData.prices.forEach(price => {
  console.log(`${price.token.symbol}: $${price.priceUSD}`);
});
```

### DEX Protocol Information

```javascript
// Read available DEX protocols
const protocols = await mcpClient.readResource('dex_data://available_protocols');
const protocolData = JSON.parse(protocols.contents[0].text);

console.log('Supported DEX Protocols:');
protocolData.protocols.forEach(protocol => {
  console.log(`${protocol.name} - Chains: ${protocol.supportedChains.join(', ')}`);
});
```

## 📝 AI-Powered Analysis

### DEX Arbitrage Analysis

```javascript
// Generate arbitrage analysis prompt
const arbitragePrompt = await mcpClient.getPrompt('dex_arbitrage_analysis', {
  tokenPair: 'ETH/USDC',
  chainId: 1,
  amount: '10'
});

// This would return a structured prompt for AI analysis
console.log('Arbitrage Analysis Prompt Generated');
console.log('Description:', arbitragePrompt.description);
```

### Custom DEX Integration Guide

```javascript
// Get integration guide for new DEX
const integrationGuide = await mcpClient.getPrompt('custom_dex_integration', {
  dexName: 'SpiritSwap',
  apiDocumentation: 'https://docs.spiritswap.finance/api'
});

console.log('Integration Guide Generated');
console.log('Instructions:', integrationGuide.messages[0].content.text);
```

## 🔗 Chain Management

### Get Chain Information

```javascript
// Get specific chain info
const polygonInfo = await mcpClient.callTool('get_chain_info', {
  chainId: 137
});

console.log('Polygon Info:', polygonInfo.data);

// Get all supported chains
const allChains = await mcpClient.callTool('get_chain_info', {});
console.log('Total supported chains:', allChains.data.totalChains);
```

## 💡 Advanced Usage Patterns

### Price Monitoring with GraphQL

```javascript
async function monitorTokenPrice(tokenAddress, chainId, threshold) {
  setInterval(async () => {
    const price = await mcpClient.callTool('get_token_price_graphql', {
      tokenAddress,
      chainId
    });
    
    const currentPrice = parseFloat(price.data.priceUSD);
    console.log(`Current price: $${currentPrice}`);
    
    if (currentPrice > threshold) {
      console.log(`🚨 Price alert! ${price.data.token.symbol} is above $${threshold}`);
    }
  }, 30000); // Check every 30 seconds
}

// Monitor WETH price
monitorTokenPrice('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 1, 2500);
```

### DEX Rate Comparison

```javascript
async function compareRatesAcrossDEXs(fromToken, toToken, amount, chainId) {
  // Get best overall quote
  const bestQuote = await mcpClient.callTool('get_best_swap_quote', {
    fromToken,
    toToken, 
    amount,
    slippage: 0.5,
    chainId,
    userAddress: '0x742d35Cc6634C0532925a3b8D214839A2d11A6e5'
  });
  
  console.log('Rate Comparison Results:');
  console.log('=======================');
  
  bestQuote.data.allQuotes.forEach(quote => {
    const rate = parseFloat(quote.toAmount) / parseFloat(quote.fromAmount);
    console.log(`${quote.dexProtocol}: ${rate.toFixed(6)} (Gas: ${quote.gasEstimate})`);
  });
  
  console.log(`\nBest Rate: ${bestQuote.data.recommendedDEX}`);
  console.log(`Savings: ${bestQuote.data.savings.percentage.toFixed(2)}%`);
}

// Compare rates for ETH -> USDC swap
compareRatesAcrossDEXs(
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0xA0b86a33E6441c7eca3cf51d4ae1ee9F8e9Cf8a',   // USDC
  '1000000000000000000', // 1 ETH
  1 // Ethereum
);
```

### Multi-Chain Portfolio Tracking

```javascript
async function trackPortfolio(walletAddress) {
  const tokens = [
    // Ethereum tokens
    { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', chainId: 1 },   // WETH
    { address: '0xA0b86a33E6441c7eca3cf51d4ae1ee9F8e9Cf8a', chainId: 1 },     // USDC
    
    // Polygon tokens  
    { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', chainId: 137 }, // WMATIC
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', chainId: 137 }, // USDC.e
    
    // BSC tokens
    { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', chainId: 56 },  // WBNB
  ];
  
  const prices = await mcpClient.callTool('get_multiple_token_prices', { tokens });
  
  console.log('Portfolio Value:');
  console.log('===============');
  
  let totalValue = 0;
  prices.data.forEach(token => {
    const price = parseFloat(token.priceUSD);
    const chainName = getChainName(token.chainId);
    console.log(`${token.token.symbol} (${chainName}): $${price.toFixed(2)}`);
    // Note: You'd need to get actual balances to calculate total value
  });
}

function getChainName(chainId) {
  const chains = {
    1: 'Ethereum',
    137: 'Polygon', 
    56: 'BSC'
  };
  return chains[chainId] || `Chain ${chainId}`;
}

// Track portfolio
trackPortfolio('0x742d35Cc6634C0532925a3b8D214839A2d11A6e5');
```

## 🧪 Testing GraphQL Endpoints

```javascript
// Test GraphQL endpoint connectivity
async function testGraphQLEndpoints() {
  const chains = [1, 137, 56, 42161, 10]; // Major EVM chains
  
  for (const chainId of chains) {
    try {
      const testPrice = await mcpClient.callTool('get_token_price_graphql', {
        tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        chainId
      });
      
      if (testPrice.success) {
        console.log(`✅ Chain ${chainId}: GraphQL endpoint working`);
      } else {
        console.log(`❌ Chain ${chainId}: ${testPrice.error.message}`);
      }
    } catch (error) {
      console.log(`❌ Chain ${chainId}: Connection failed`);
    }
  }
}

testGraphQLEndpoints();
```

## 🔧 Error Handling

```javascript
// Robust error handling for DEX operations
async function safeSwapQuote(params) {
  try {
    const quote = await mcpClient.callTool('get_best_swap_quote', params);
    
    if (!quote.success) {
      console.error('Quote failed:', quote.error.message);
      
      // Try specific DEX as fallback
      console.log('Trying 1inch as fallback...');
      const fallbackQuote = await mcpClient.callTool('get_quote_from_specific_dex', {
        ...params,
        dexProtocol: '1inch'
      });
      
      return fallbackQuote;
    }
    
    return quote;
  } catch (error) {
    console.error('Swap quote error:', error);
    return { success: false, error: error.message };
  }
}

// Usage with error handling
safeSwapQuote({
  fromToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  toToken: '0xA0b86a33E6441c7eca3cf51d4ae1ee9F8e9Cf8a',
  amount: '1000000000000000000',
  slippage: 0.5,
  chainId: 1,
  userAddress: '0x742d35Cc6634C0532925a3b8D214839A2d11A6e5'
});
```

## 🚀 Performance Tips

1. **Batch Requests**: Use `get_multiple_token_prices` instead of multiple single requests
2. **Cache Results**: The GraphQL service includes caching, but you can add application-level caching
3. **Parallel Queries**: DEX aggregation runs quotes in parallel automatically
4. **Chain Selection**: Specify exact chains to reduce unnecessary API calls

## 🔗 Integration Examples

### With Web3 Libraries

```javascript
import { ethers } from 'ethers';

// Combine MCP quotes with actual transaction execution
async function executeOptimalSwap(swapParams) {
  // Get best quote from MCP
  const quote = await mcpClient.callTool('get_best_swap_quote', swapParams);
  
  if (!quote.success) {
    throw new Error('Failed to get quote');
  }
  
  // Use ethers.js to execute the transaction
  const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Implementation would depend on the specific DEX's contract interface
  console.log(`Executing swap via ${quote.data.recommendedDEX}`);
  console.log(`Expected output: ${quote.data.bestQuote.toAmount}`);
}
```

This comprehensive set of examples demonstrates the full capabilities of the enhanced MCP EVM DEX server with GraphQL price feeds and multi-DEX aggregation! 