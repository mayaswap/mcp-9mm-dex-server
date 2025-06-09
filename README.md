# 🚀 MCP 9MM DEX Server

A powerful **Model Context Protocol (MCP) server** that provides AI assistants (like Claude) with comprehensive DEX trading capabilities, focusing on the **9MM DEX protocol** across Base, PulseChain, and Sonic networks.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.org)

## 🌟 Features

- **🔐 Auto-Generated Wallets**: Secure wallet generation for each user (no MetaMask needed!)
- **⛓️ Multi-Chain Support**: Base, PulseChain, Sonic, and extensible to any EVM chain
- **💱 9MM DEX Integration**: Native support for 9MM DEX protocol operations
- **🤖 15+ AI Tools**: Swap quotes, price comparison, wallet management, and more
- **📊 Real-Time Data**: Live price feeds and liquidity information
- **🔒 Enterprise Security**: JWT authentication, isolated wallets, secure key management

## 📋 Prerequisites

- **Node.js** 20.0.0 or higher
- **npm** or **yarn**
- **Claude Desktop** app (for MCP integration)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/mayaswap/mcp-9mm-dex-server.git
cd mcp-9mm-dex-server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your RPC URLs and any API keys
```

### 3. Build the Server

```bash
npm run build
```

### 4. Configure Claude Desktop

Add to your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-dex-server": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-9mm-dex-server/dist/index.js"],
      "env": {}
    }
  }
}
```

### 5. Restart Claude Desktop

Quit and restart Claude Desktop to load the MCP server.

## 🔧 Available MCP Tools

### Wallet Management
- `create_new_wallet` - Generate a secure auto-wallet
- `get_my_wallet_info` - Check wallet balances and info
- `get_wallet_private_key` - Retrieve private credentials
- `logout_wallet` - End wallet session

### 9MM DEX Operations
- `get_9mm_swap_quote` - Get swap quotes from 9MM
- `execute_wallet_swap` - Execute token swaps
- `compare_9mm_prices` - Compare prices across chains
- `get_9mm_pool_info` - Get liquidity pool data
- `get_9mm_best_chain` - Find optimal chain for trading

### Information Tools
- `get_9mm_supported_chains` - List all supported chains
- `get_9mm_common_tokens` - Get token lists per chain
- `get_9mm_user_balances` - Check multi-chain balances

## 💬 Usage Examples

In Claude Desktop, you can use natural language:

```
"Create a new wallet for me"
"What's the price of WETH on Base?"
"Compare USDC to ETH prices across all chains"
"Execute a swap of 100 USDC to ETH on Base"
"Show me the best chain for trading USDC/WETH"
```

## 🏗️ Project Structure

```
mcp-9mm-dex-server/
├── src/
│   ├── mcp/           # MCP server and tools
│   ├── services/      # Core services (wallet, user, etc.)
│   ├── config/        # Chain and token configurations
│   ├── types/         # TypeScript definitions
│   └── utils/         # Helper utilities
├── dist/              # Compiled JavaScript (after build)
├── tests/             # Test suites
└── package.json       # Dependencies and scripts
```

## 🔐 Security Features

- **Auto-Generated Wallets**: Each user gets an isolated wallet
- **No External Dependencies**: No MetaMask or WalletConnect needed
- **JWT Authentication**: Secure session management
- **Private Key Isolation**: Keys never leave the server
- **Input Validation**: All inputs sanitized and validated

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

### Running Tests

```bash
npm test
```

### Adding New Chains

1. Add chain config in `src/config/chains.ts`
2. Add RPC URL in `.env`
3. Update token lists in `src/config/tokens.ts`

### Adding New Tools

1. Create tool handler in `src/mcp/tools/`
2. Register in `src/mcp/tools/index.ts`
3. Add TypeScript types in `src/types/`

## 📊 Supported Networks

| Network | Chain ID | Status | Features |
|---------|----------|--------|----------|
| Base | 8453 | ✅ Active | Full 9MM support |
| PulseChain | 369 | ✅ Active | Full 9MM support |
| Sonic | 146 | ✅ Active | Full 9MM support |
| Ethereum | 1 | 🔧 Extensible | Add via config |
| Polygon | 137 | 🔧 Extensible | Add via config |
| BSC | 56 | 🔧 Extensible | Add via config |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.org) by Anthropic
- [9MM DEX](https://9mm.exchange) Protocol
- EVM ecosystem tools and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mayaswap/mcp-9mm-dex-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mayaswap/mcp-9mm-dex-server/discussions)

---

**⚡ Powered by MCP and built for the decentralized future!** 