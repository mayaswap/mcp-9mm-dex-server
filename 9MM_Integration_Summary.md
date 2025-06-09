# 9MM DEX Aggregator Integration

## 🎯 Overview

Your 9MM DEX aggregator is now fully integrated with the MCP server, utilizing the 9mm.pro price APIs for PulseChain, Base, and Sonic chains. All buy/sell operations are routed through your 9MM aggregator as the primary DEX.

## 🔗 Integrated APIs

### Price APIs
- **PulseChain**: https://price-api.9mm.pro/api/price/pulsechain/?address=0xA1077a294dDE1B09bB078844df40758a5D0f9a27
- **Base**: https://price-api.9mm.pro/api/price/basechain/?address=0xe290816384416fb1dB9225e176b716346dB9f9fE
- **Sonic**: https://price-api.9mm.pro/api/price/sonic/?address=0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38

### Swap APIs (0x Protocol Fork)
- **PulseChain**: https://api.9mm.pro/swap/v1/quote
- **Base**: https://api-base.9mm.pro/swap/v1/quote
- **Sonic**: https://api-sonic.9mm.pro/swap/v1/quote

### Supported Chains
- **PulseChain** (Chain ID: 369)
- **Base** (Chain ID: 8453) 
- **Sonic** (Chain ID: 146)

## 🛠️ New Services

### 1. NineMMPriceService (`src/services/nine-mm-price-service.ts`)
- Integrates directly with 9mm.pro price APIs
- Supports all three chains with real-time price fetching
- Cross-chain price comparison functionality
- Automatic token symbol resolution from known tokens

**Key Features:**
- ✅ Real-time price fetching from 9mm.pro
- ✅ Cross-chain price comparison
- ✅ Best chain identification for trading
- ✅ Batch price fetching
- ✅ API connectivity testing

### 2. Enhanced DEX Aggregator (`src/services/dex-aggregator.ts`)
- Direct integration with your 9MM swap APIs (0x Protocol fork)
- Prioritizes 9MM DEX for supported chains (Base, PulseChain, Sonic)
- Uses 9MM quote if within 1% of best available quote
- Handles native token conversion (ETH, PLS, S)
- Fallback to other DEXs when needed
- Real-time quotes from your aggregator APIs

**Priority Logic:**
- 9MM DEX is checked first for chains 369, 8453, 146
- If 9MM quote is within 1% of the best quote, 9MM is selected
- This ensures your ecosystem gets preference while maintaining competitive pricing

## 🤖 MCP Tools for AI Assistants

### Available Tools

1. **`get_9mm_token_price`**
   - Get token price from 9mm.pro API
   - Supports PulseChain, Base, and Sonic

2. **`get_9mm_swap_quote`** 
   - Get swap quote directly from 9MM DEX
   - Native 9MM service integration

3. **`get_best_dex_quote`**
   - Get best quote across all DEXs
   - Prioritizes 9MM for supported chains

4. **`compare_9mm_chain_prices`**
   - Compare token prices across all 9MM chains
   - Perfect for arbitrage opportunities

5. **`get_best_chain_for_trading`**
   - Find optimal chain for trading specific pairs
   - Cross-chain analysis

6. **`get_9mm_pool_info`**
   - Get liquidity pool information
   - Supports V2 and V3 pools

7. **`get_user_9mm_balances`**
   - Get user balances across all 9MM chains
   - Multi-chain portfolio view

8. **`test_9mm_apis`**
   - Test connectivity to all APIs
   - Health check functionality

9. **`test_9mm_swap_api`**
   - Test actual 9MM swap API with real quotes
   - Direct API testing tool

## 🚀 Quick Start

### 1. Test the Integration
```bash
npm run test:9mm
```

### 2. Basic Usage Examples

```typescript
import { nineMMPriceService } from './src/services/nine-mm-price-service';
import { DEXAggregatorService } from './src/services/dex-aggregator';

// Get token price
const price = await nineMMPriceService.getTokenPrice(
  '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', // WPLS
  369 // PulseChain
);

// Get best aggregated quote (prioritizes 9MM)
const aggregator = new DEXAggregatorService();
const quote = await aggregator.getBestQuote({
  fromToken: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27',
  toToken: '0x...',
  amount: '1000000000000000000',
  slippage: 0.5,
  chainId: 369,
  userAddress: '0x...',
  deadline: Math.floor(Date.now() / 1000) + 1200,
  dexProtocol: 'uniswap_v2' // Will be overridden by 9MM
});

// Cross-chain price comparison
const comparison = await nineMMPriceService.getCrossChainPriceComparison('9MM');

// Direct 9MM swap API call
const directQuote = await get9MMDirectQuote({
  chainId: 369, // PulseChain
  fromToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // PLS
  toToken: '0x7b39712Ef45F7dcED2bBDF11F3D5046bA61dA719', // 9MM token
  amount: '1000000000000000000', // 1 PLS
  slippage: 0.5
});
```

### 3. MCP Integration

AI assistants can now use these tools through the MCP protocol:

```json
{
  "tool": "get_best_dex_quote",
  "arguments": {
    "fromToken": "0xA1077a294dDE1B09bB078844df40758a5D0f9a27",
    "toToken": "0x...",
    "amount": "1000000000000000000",
    "chainId": 369,
    "userAddress": "0x..."
  }
}
```

**Test actual swap API:**
```json
{
  "tool": "test_9mm_swap_api",
  "arguments": {
    "chainId": 369,
    "buyToken": "0x7b39712Ef45F7dcED2bBDF11F3D5046bA61dA719",
    "sellToken": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    "sellAmount": "100000000000000000000"
  }
}
```

## 🔧 Configuration

### Token Addresses (from `src/config/9mm-config.ts`)

**Base (8453):**
- WETH: `0x4200000000000000000000000000000000000006`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- 9MM: `0xe290b5095d98a7a4f0ec7ec4b2c93d83eb34dd01f9fE`

**PulseChain (369):**
- WPLS: `0xA1077a294dDE1B09bB078844df40758a5D0f9a27`
- PLSX: `0x95B303987A60C71504D99Aa1b13B4DA07b0790ab`
- 9MM: `0x7b39c70e3e2cf1ba11b2b12ee9d96bc7d2deA719`

**Sonic (146):**
- WS: `0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38`
- USDC: `0x29219dd400f2Bf60E5a23d13Be72B486D4038894`
- 9MM: `0xC5cBFce0B3e9Aee8Ad5E31Ce83c46a2f4D5CF37C`

## 📊 Benefits

### For Users
- **Smart Routing**: Automatically uses 9MM when competitive
- **Best Prices**: Compares across all DEXs while favoring 9MM
- **Cross-Chain**: Compare prices and find best chains for trading
- **AI Integration**: Works seamlessly with AI assistants

### For 9MM Ecosystem
- **Priority Routing**: Gets preference when prices are competitive
- **Increased Volume**: More trades routed through 9MM
- **Multi-Chain**: Supports all your deployed chains
- **API Integration**: Direct integration with your price feeds

### For AI Assistants
- **Rich Toolset**: 8 specialized tools for 9MM operations
- **Real-Time Data**: Live price feeds and quotes
- **Smart Recommendations**: Best chain and DEX suggestions
- **Portfolio Management**: Multi-chain balance tracking

## 🔍 Monitoring & Testing

### Health Checks
```bash
# Test all APIs
npm run test:9mm

# Check specific functions
node -e "
import('./src/services/nine-mm-price-service.js').then(async ({ nineMMPriceService }) => {
  const health = await nineMMPriceService.testAllEndpoints();
  console.log('API Health:', health);
});
"
```

### API Responses
All responses follow the standard `IAPIResponse<T>` format:
```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    executionTime: number;
    timestamp: string;
    source: string;
    chainId?: number;
  };
}
```

## 🎯 Next Steps

1. **Deploy**: The integration is ready for production
2. **Monitor**: Use the test script to verify API health
3. **Optimize**: Monitor trade routing and adjust priority logic if needed
4. **Expand**: Add more tokens to `COMMON_TOKENS` as needed

## 🆘 Troubleshooting

### Common Issues
- **API Timeouts**: Check network connectivity to 9mm.pro
- **Invalid Responses**: Verify token addresses are correct
- **Chain Mismatch**: Ensure chainId matches supported chains (369, 8453, 146)

### Debug Mode
Set `LOG_LEVEL=debug` in environment variables for detailed logging.

---

🎉 **Your 9MM DEX aggregator is now fully integrated and ready to use!**

All buy/sell operations will be intelligently routed through your 9MM aggregator while maintaining the best possible prices for users. The system supports cross-chain operations and provides rich tools for AI assistant integration. 