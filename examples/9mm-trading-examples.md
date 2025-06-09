# 9MM DEX MCP Server - Usage Examples

This guide shows how AI assistants can interact with the 9MM MCP server to perform various DeFi operations.

## 🔄 Token Swaps

### Basic Swap Quote
```json
// Tool: get_9mm_swap_quote
{
  "chainId": 8453,
  "fromToken": "USDC",
  "toToken": "WETH",
  "amount": "1000000000",
  "slippage": 0.5,
  "userAddress": "0x742d35Cc6634C0532925a3b8D4431e5e04334aBb"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chainId": 8453,
    "chainName": "Base",
    "fromToken": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "toToken": "0x4200000000000000000000000000000000000006",
    "fromAmount": "1000000000",
    "toAmount": "2847392057348574",
    "toAmountMin": "2832924637036030",
    "priceImpact": 0.1,
    "fee": 0.0017,
    "gasEstimate": "180000",
    "estimatedGasCost": "18000000000000"
  }
}
```

### Cross-Chain Price Comparison
```json
// Tool: compare_9mm_prices
{
  "fromToken": "USDC",
  "toToken": "WETH", 
  "amount": "1000000000"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bestChain": 8453,
    "priceComparison": [
      {
        "chainId": 8453,
        "chainName": "Base",
        "outputAmount": "2847392057348574",
        "priceImpact": 0.1,
        "gasEstimate": "180000"
      },
      {
        "chainId": 369,
        "chainName": "PulseChain", 
        "outputAmount": "2832947583927463",
        "priceImpact": 0.15,
        "gasEstimate": "220000"
      },
      {
        "chainId": 146,
        "chainName": "Sonic",
        "outputAmount": "2840124759302847",
        "priceImpact": 0.12,
        "gasEstimate": "190000"
      }
    ]
  }
}
```

## 💧 Liquidity Management

### Get Pool Information
```json
// Tool: get_9mm_pool_info
{
  "chainId": 8453,
  "tokenA": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "tokenB": "0x4200000000000000000000000000000000000006"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "chainId": 8453,
    "chainName": "Base",
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "token0": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "token1": "0x4200000000000000000000000000000000000006",
    "reserve0": "5000000000000",
    "reserve1": "1750000000000000000",
    "totalSupply": "2915475906000000",
    "fee": 0.0017,
    "liquidityUSD": "10000000"
  }
}
```

## 🏦 Portfolio Management

### Check User Balances
```json
// Tool: get_9mm_user_balances
{
  "userAddress": "0x742d35Cc6634C0532925a3b8D4431e5e04334aBb"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "8453": {
      "chainName": "Base",
      "nativeCurrency": "ETH",
      "tokens": {
        "ETH": "1500000000000000000",
        "USDC": "2500000000",
        "WETH": "800000000000000000",
        "9MM": "100000000000000000000"
      }
    },
    "369": {
      "chainName": "PulseChain",
      "nativeCurrency": "PLS",
      "tokens": {
        "PLS": "5000000000000000000000",
        "WPLS": "2000000000000000000000",
        "9MM": "250000000000000000000"
      }
    },
    "146": {
      "chainName": "Sonic", 
      "nativeCurrency": "S",
      "tokens": {
        "S": "3000000000000000000000",
        "WS": "1000000000000000000000",
        "9MM": "75000000000000000000"
      }
    }
  }
}
```

## 🤖 AI Conversation Examples

### Smart Trading Assistant

**User**: "I want to swap 1000 USDC for ETH. Find me the best deal."

**AI Response**: 
> I'll help you find the best rate for swapping 1000 USDC to ETH across all 9MM chains.
> 
> *[AI calls compare_9mm_prices tool]*
> 
> **Best Option: Base Network** 🥇
> - Output: 0.284 ETH (2.84% better than other chains)
> - Price Impact: 0.1%
> - Gas Cost: ~$0.02
> - Total Fee: 0.17%
> 
> **Why Base is best:**
> - Deepest liquidity pool ($10M TVL)
> - Lowest slippage
> - Fast settlement (2-3 seconds)
> 
> Would you like me to prepare the transaction for MetaMask?

### Liquidity Strategy Advisor  

**User**: "I have $5000 to provide liquidity. What's the best strategy?"

**AI Response**:
> Based on current 9MM pool performance, here's my recommended allocation:
> 
> *[AI calls get_9mm_pool_info for each chain]*
> 
> **Recommended Strategy**: 🎯
> 
> **60% on Base ($3,000)**
> - Pool: USDC/ETH
> - APR: 12.5%
> - Volume: $500K daily
> - Risk: Low impermanent loss
> 
> **30% on PulseChain ($1,500)**  
> - Pool: USDC/WPLS
> - APR: 28.3% 
> - Volume: $150K daily
> - Risk: Medium impermanent loss
> 
> **10% on Sonic ($500)**
> - Pool: USDC/WS
> - APR: 22.1%
> - Volume: $75K daily  
> - Risk: Medium impermanent loss
> 
> **Expected Monthly Return**: ~$67 (1.34% monthly)
> 
> This strategy balances high yields with risk management. Shall I help you execute this plan?

### Cross-Chain Arbitrage Finder

**User**: "Are there any arbitrage opportunities right now?"

**AI Response**:
> I found a profitable arbitrage opportunity! 🎯
> 
> *[AI calls compare_9mm_prices for multiple pairs]*
> 
> **WETH Price Difference Detected:**
> - PulseChain: $2,847 per ETH
> - Base: $2,871 per ETH  
> - **Profit Margin**: 0.84% ($24 per ETH)
> 
> **Arbitrage Strategy:**
> 1. Buy WETH on PulseChain (lower price)
> 2. Bridge to Base via native bridge
> 3. Sell WETH on Base (higher price)
> 
> **For $10,000 trade:**
> - Gross Profit: ~$84
> - Bridge Cost: ~$15
> - Gas Fees: ~$5
> - **Net Profit**: ~$64 (0.64%)
> 
> **Time Sensitivity**: This opportunity may close within 10-15 minutes due to arbitrage bots.
> 
> Want me to prepare the transactions?

## 🔧 Advanced Use Cases

### DeFi Strategy Bot
```json
// Multi-step strategy execution
{
  "strategy": "yield_farming_optimization",
  "steps": [
    {
      "action": "compare_9mm_prices",
      "params": {
        "fromToken": "USDC",
        "toToken": "9MM",
        "amount": "5000000000"
      }
    },
    {
      "action": "get_9mm_best_chain", 
      "params": {
        "fromToken": "USDC",
        "toToken": "9MM",
        "amount": "5000000000"
      }
    },
    {
      "action": "prepare_9mm_swap_transaction",
      "condition": "best_chain_found"
    }
  ]
}
```

### Portfolio Rebalancing
```json
// Automated portfolio management
{
  "rebalance_strategy": {
    "target_allocation": {
      "base_percentage": 50,
      "pulsechain_percentage": 35,
      "sonic_percentage": 15
    },
    "rebalance_threshold": 5,
    "auto_compound": true
  }
}
```

## 🚨 Risk Management Examples

### Slippage Protection
```json
// High slippage warning
{
  "warning": "High slippage detected",
  "current_slippage": 2.3,
  "recommended_action": "split_trade",
  "alternative_chains": [
    {
      "chainId": 8453,
      "slippage": 0.8,
      "recommendation": "primary_choice"
    }
  ]
}
```

### Gas Optimization
```json
// Dynamic gas management
{
  "gas_analysis": {
    "current_gas_price": "15 gwei",
    "optimal_time": "in_2_hours",
    "estimated_savings": "40%",
    "urgency_factor": "low"
  }
}
```

## 📊 Analytics Examples

### Performance Tracking
```json
// Portfolio performance over time
{
  "portfolio_metrics": {
    "total_value_usd": 15420.50,
    "24h_change": "+2.3%",
    "7d_change": "+8.7%",
    "best_performing_chain": "PulseChain",
    "total_fees_earned": 127.30,
    "impermanent_loss": "-0.4%"
  }
}
```

### Market Intelligence
```json
// Market trend analysis
{
  "market_trends": {
    "dominant_chain": "Base",
    "volume_leaders": ["USDC/ETH", "9MM/ETH", "USDC/9MM"],
    "arbitrage_frequency": "high",
    "optimal_trading_hours": "14:00-18:00 UTC"
  }
}
```

---

These examples show the power of combining AI intelligence with 9MM's multi-chain DEX functionality. The MCP server enables seamless integration between AI assistants and DeFi protocols! 🚀 