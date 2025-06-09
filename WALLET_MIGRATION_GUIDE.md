# Wallet Migration Guide: External to Auto-Generated

## 🔄 Migration Overview

The MCP DEX system has been updated to use **auto-generated wallets** instead of external wallet connections for enhanced security. This guide helps you migrate your code and workflows.

## 🚨 Breaking Changes

### Removed Tools
- ❌ `connect_wallet` - External wallet connection removed
- ❌ `generate_wallet` - Old wallet generation deprecated
- ❌ MetaMask integration - No longer supported
- ❌ WalletConnect integration - No longer supported

### New Tools
- ✅ `create_new_wallet` - Auto-generates secure wallet per user
- ✅ `get_my_wallet_info` - User-scoped wallet information
- ✅ `get_wallet_private_key` - Direct access to user's credentials
- ✅ `execute_wallet_swap` - Token-authenticated swaps
- ✅ `approve_wallet_token` - Token-authenticated approvals
- ✅ `check_wallet_allowance` - Token-authenticated allowance checks
- ✅ `logout_wallet` - Secure session management

## 📝 Code Migration Examples

### 1. Wallet Creation

#### Before (OLD - Deprecated)
```javascript
// ❌ No longer works
const wallet = await mcpClient.callTool('connect_wallet', {
  privateKey: '0x1234...',
  chainIds: [8453, 369, 146]
});

// ❌ No longer works  
const newWallet = await mcpClient.callTool('generate_wallet', {
  chainIds: [8453, 369, 146]
});
```

#### After (NEW - Secure)
```javascript
// ✅ Auto-generated wallet with user session
const userSession = await mcpClient.callTool('create_new_wallet', {
  chainIds: [8453, 369, 146] // Optional: defaults to all supported
});

// Returns:
// {
//   user: { id, walletAddress, createdAt },
//   wallet: { address, privateKey, mnemonic, chainIds },
//   token: 'auth_token_for_trading'
// }

// Store the token for subsequent operations
const authToken = userSession.data.token;
```

### 2. Getting Wallet Information

#### Before (OLD)
```javascript
// ❌ No longer works
const walletInfo = await mcpClient.callTool('get_wallet_info');
```

#### After (NEW)
```javascript
// ✅ User-scoped wallet information
const walletInfo = await mcpClient.callTool('get_my_wallet_info', {
  token: authToken
});

// Returns balance, wallet address, supported chains, etc.
```

### 3. Executing Swaps

#### Before (OLD)
```javascript
// ❌ No longer works - assumed connected wallet
const swap = await mcpClient.callTool('execute_swap', {
  chainId: 8453,
  fromToken: 'USDC',
  toToken: 'ETH',
  amount: '100000000',
  slippage: 0.5
});
```

#### After (NEW)
```javascript
// ✅ Token-authenticated swap with user's auto-wallet
const swap = await mcpClient.callTool('execute_wallet_swap', {
  token: authToken,
  chainId: 8453,
  fromToken: 'USDC', 
  toToken: 'ETH',
  amount: '100000000',
  slippage: 0.5,
  deadline: 20 // minutes
});
```

### 4. Token Approvals

#### Before (OLD)
```javascript
// ❌ No longer works
const approval = await mcpClient.callTool('approve_token', {
  chainId: 8453,
  tokenAddress: '0x...',
  amount: '1000000000000000000'
});
```

#### After (NEW)
```javascript
// ✅ Token-authenticated approval
const approval = await mcpClient.callTool('approve_wallet_token', {
  token: authToken,
  chainId: 8453,
  tokenAddress: '0x...',
  amount: '1000000000000000000' // Optional: defaults to unlimited
});
```

### 5. Checking Allowances

#### Before (OLD)
```javascript
// ❌ No longer works
const allowance = await mcpClient.callTool('check_token_allowance', {
  chainId: 8453,
  tokenAddress: '0x...',
  ownerAddress: '0x...'
});
```

#### After (NEW)
```javascript
// ✅ Automatic owner address from user session
const allowance = await mcpClient.callTool('check_wallet_allowance', {
  token: authToken,
  chainId: 8453,
  tokenAddress: '0x...'
  // No need to specify owner - automatically uses user's wallet
});
```

### 6. Session Management

#### Before (OLD)
```javascript
// ❌ No session management existed
// Wallets stayed connected indefinitely
```

#### After (NEW)
```javascript
// ✅ Proper session lifecycle management

// Get private credentials when needed
const credentials = await mcpClient.callTool('get_wallet_private_key', {
  token: authToken
});

// Securely end session
const logout = await mcpClient.callTool('logout_wallet', {
  token: authToken
});
```

## 🔧 Application Architecture Changes

### Session Management
```javascript
class WalletManager {
  constructor() {
    this.authToken = null;
    this.walletAddress = null;
  }

  async createWallet(chainIds = [8453, 369, 146]) {
    const session = await mcpClient.callTool('create_new_wallet', { chainIds });
    
    if (session.success) {
      this.authToken = session.data.token;
      this.walletAddress = session.data.wallet.address;
      
      // Store credentials securely (user's responsibility)
      this.notifyUserToSaveCredentials(session.data.wallet);
      
      return session.data;
    }
    throw new Error(session.error);
  }

  async executeSwap(params) {
    if (!this.authToken) {
      throw new Error('No active wallet session. Create wallet first.');
    }

    return await mcpClient.callTool('execute_wallet_swap', {
      token: this.authToken,
      ...params
    });
  }

  async logout() {
    if (this.authToken) {
      await mcpClient.callTool('logout_wallet', { token: this.authToken });
      this.authToken = null;
      this.walletAddress = null;
    }
  }

  notifyUserToSaveCredentials(wallet) {
    console.warn('🔒 SAVE YOUR CREDENTIALS SAFELY:');
    console.warn('Private Key:', wallet.privateKey);
    console.warn('Mnemonic:', wallet.mnemonic);
    console.warn('⚠️ Store these offline securely - you cannot recover them!');
  }
}
```

### Error Handling
```javascript
class WalletError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function safeWalletOperation(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.message.includes('Invalid or expired token')) {
      throw new WalletError('Session expired. Please create a new wallet.', 'SESSION_EXPIRED');
    }
    if (error.message.includes('Insufficient balance')) {
      throw new WalletError('Insufficient funds for transaction.', 'INSUFFICIENT_FUNDS');
    }
    throw new WalletError(error.message, 'UNKNOWN_ERROR');
  }
}
```

## 📋 Migration Checklist

### For Developers
- [ ] Update wallet creation calls to `create_new_wallet`
- [ ] Add authentication token parameter to all wallet operations
- [ ] Implement session management in your application
- [ ] Update error handling for token-based operations
- [ ] Remove external wallet dependencies (MetaMask, WalletConnect)
- [ ] Update user interface to handle auto-generated credentials
- [ ] Test all wallet operations with the new token-based system

### For Users
- [ ] Understand that wallets are auto-generated (no external wallet needed)
- [ ] Safely store private key and mnemonic when provided
- [ ] Use authentication token for all trading operations
- [ ] Log out properly when finished trading
- [ ] Import private key to external wallets if needed for other purposes

### For Security
- [ ] Implement secure credential storage recommendations
- [ ] Add session timeout handling
- [ ] Implement proper logout procedures
- [ ] Add warnings about credential safety
- [ ] Test token expiration scenarios

## 🚀 Benefits After Migration

### Enhanced Security
- ✅ No exposure to external wallet vulnerabilities
- ✅ Isolated user sessions
- ✅ No browser extension dependencies
- ✅ Direct private key control

### Improved User Experience
- ✅ Simplified onboarding (no wallet connection required)
- ✅ Consistent experience across all devices
- ✅ No MetaMask popups or confirmations
- ✅ Faster transaction execution

### Better Development Experience
- ✅ Predictable wallet behavior
- ✅ No external wallet integration complexity
- ✅ Better error handling and debugging
- ✅ Simplified testing

## 🆘 Troubleshooting

### Common Issues

**"Invalid or expired token"**
```javascript
// Solution: Create new wallet session
const newSession = await mcpClient.callTool('create_new_wallet');
authToken = newSession.data.token;
```

**"No wallet connected"**
```javascript
// Solution: Use auto-wallet tools, not old wallet tools
// ❌ Don't use: execute_swap
// ✅ Use: execute_wallet_swap with token
```

**"Cannot find old wallet tools"**
```javascript
// Old tools are deprecated, use new equivalents:
// connect_wallet → create_new_wallet
// generate_wallet → create_new_wallet  
// get_wallet_info → get_my_wallet_info
// execute_swap → execute_wallet_swap
```

## 📞 Support

### Migration Support
- Check [AUTO_WALLET_SECURITY_GUIDE.md](./AUTO_WALLET_SECURITY_GUIDE.md) for security best practices
- Review updated tool documentation in the main README
- Test the new system with small amounts first

### Community Resources
- Example implementations in the `/examples` directory
- Updated integration tests demonstrating new patterns
- Security recommendations and best practices

---

**🔐 The auto-generated wallet system provides enhanced security while simplifying the user experience. Happy trading!** 