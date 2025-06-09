# Auto-Generated Wallet Security Guide

## 🔒 Security-First Approach

For enhanced security, the MCP DEX system has been updated to **automatically generate wallets for each user** instead of requiring external wallet connections (MetaMask, WalletConnect, etc.).

## 🛡️ Why Auto-Generated Wallets?

### Security Benefits
- **No External Exposure**: Your wallet is generated locally within the MCP system
- **Isolated Sessions**: Each user gets their own unique wallet and session
- **No Browser Extensions**: Eliminates risks from browser wallet extensions
- **Direct Control**: You receive the private key and mnemonic directly
- **No Third-Party Dependencies**: No reliance on external wallet providers

### Removed Attack Vectors
- ❌ MetaMask phishing attacks
- ❌ WalletConnect man-in-the-middle attacks  
- ❌ Browser extension vulnerabilities
- ❌ Cross-site scripting targeting wallets
- ❌ Malicious dApp connections

## 🚀 How It Works

### 1. Wallet Creation
```bash
# Use the MCP tool to create your wallet
create_new_wallet
```

**What happens:**
- System generates a cryptographically secure wallet
- You receive a unique authentication token
- Private key and mnemonic are provided to you
- Wallet is automatically connected to all supported chains

### 2. Trading Operations
```bash
# All trading uses your auto-generated wallet
execute_wallet_swap {
  "token": "your_auth_token",
  "chainId": 8453,
  "fromToken": "USDC",
  "toToken": "ETH",
  "amount": "100000000"
}
```

### 3. Session Management
- Your session remains active for 24 hours
- Automatic cleanup of expired sessions
- Secure token-based authentication

## 🔐 Critical Security Instructions

### 1. Save Your Credentials Safely
When you create a wallet, you'll receive:
- **Private Key**: `0x1234...` - Controls your funds
- **Mnemonic**: `word1 word2 ...` - Recovery phrase
- **Authentication Token**: For MCP operations

### 2. Storage Best Practices
```
✅ DO:
- Write down your private key and mnemonic offline
- Store them in a secure physical location
- Use a password manager for the auth token
- Keep multiple secure backups

❌ DON'T:
- Share credentials with anyone
- Store them in cloud services
- Take screenshots of credentials
- Email or message them to yourself
```

### 3. Fund Management
- Transfer funds to your auto-generated wallet address
- Use the provided private key to import into other wallets if needed
- Always verify the wallet address before sending funds

## 🎯 Available Operations

### Wallet Management
- `create_new_wallet` - Create new auto-generated wallet
- `get_my_wallet_info` - Check balance and wallet status
- `get_wallet_private_key` - Retrieve your private credentials
- `logout_wallet` - Securely end your session

### Trading Operations
- `execute_wallet_swap` - Perform token swaps
- `approve_wallet_token` - Approve token spending
- `check_wallet_allowance` - Check approval status

## 🔄 Migration from External Wallets

If you were using external wallets before:

### Old Method (Deprecated)
```bash
# ❌ No longer available
connect_wallet { "privateKey": "0x..." }
```

### New Method (Secure)
```bash
# ✅ Use this instead
create_new_wallet { "chainIds": [8453, 369, 146] }
```

### Benefits of Migration
1. **Enhanced Security**: No exposure to external wallet vulnerabilities
2. **Simplified UX**: No need to manage multiple wallet connections
3. **Better Performance**: Direct wallet operations without external dependencies
4. **Consistent Experience**: Same interface across all supported chains

## 🚨 Emergency Procedures

### If You Lose Your Credentials
- **Private key/mnemonic lost**: Funds may be permanently inaccessible
- **Auth token lost**: Create a new wallet and transfer funds
- **Wallet compromised**: Immediately transfer funds to a new wallet

### Session Security
- Always logout when finished trading
- Never share your auth token
- Create new sessions for extended trading periods

## 📞 Support and Recovery

### Self-Service Options
1. Use `get_wallet_private_key` to retrieve credentials
2. Import your private key into any standard wallet
3. Create new wallets as needed

### Best Practices
- Regular security audits of your storage methods
- Periodic testing of your backup recovery process
- Stay informed about security updates

## 🔍 Technical Details

### Wallet Generation
- Uses `ethers.js` secure random generation
- HD wallet standard with mnemonic phrase
- Compatible with all standard wallet applications

### Supported Networks
- **Base Chain** (8453): For high-volume trading
- **PulseChain** (369): For low-cost operations  
- **Sonic** (146): For fast transactions

### Security Features
- JWT-based session management
- Automatic session cleanup
- Rate limiting on all operations
- Comprehensive audit logging

---

**Remember**: With great power comes great responsibility. Your private key is your sole access to your funds. Keep it safe! 🔐 