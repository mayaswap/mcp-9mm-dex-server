/**
 * Auto-Generated Wallet Example
 * Demonstrates the new secure auto-wallet system
 */

// This example shows how to use the new auto-generated wallet tools
// instead of external wallet connections

async function autoWalletExample(mcpClient) {
  console.log('🔐 Auto-Wallet Example: Secure Trading Without External Wallets');
  console.log('===============================================================\n');

  try {
    // Step 1: Create a new auto-generated wallet
    console.log('📝 Step 1: Creating auto-generated wallet...');
    const walletCreation = await mcpClient.callTool('create_new_wallet', {
      chainIds: [8453, 369, 146] // Base, PulseChain, Sonic
    });

    if (!walletCreation.success) {
      throw new Error(walletCreation.error);
    }

    const { user, wallet, token } = walletCreation.data;
    
    console.log('✅ Wallet created successfully!');
    console.log(`   👤 User ID: ${user.id}`);
    console.log(`   💳 Wallet Address: ${wallet.address}`);
    console.log(`   🔑 Auth Token: ${token.substring(0, 20)}...`);
    console.log(`   🌐 Supported Chains: ${wallet.supportedChains.join(', ')}`);
    
    // ⚠️ CRITICAL: Save these credentials safely!
    console.log('\n🚨 CRITICAL SECURITY INFORMATION:');
    console.log(`   🔐 Private Key: ${wallet.privateKey}`);
    console.log(`   📝 Mnemonic: ${wallet.mnemonic}`);
    console.log('   ⚠️  SAVE THESE OFFLINE SECURELY - YOU CANNOT RECOVER THEM!');
    console.log('   🛡️  Never share these with anyone!');

    // Step 2: Check wallet information
    console.log('\n📊 Step 2: Checking wallet balances...');
    const walletInfo = await mcpClient.callTool('get_my_wallet_info', {
      token: token
    });

    if (walletInfo.success) {
      console.log('💰 Wallet Balances:');
      walletInfo.data.balances.forEach(balance => {
        console.log(`   Chain ${balance.chainId}: ${balance.nativeBalance} ETH`);
      });
      console.log(`📊 Total Balance: ${walletInfo.data.totalBalance} ETH`);
    }

    // Step 3: Example token approval (if you have tokens)
    console.log('\n🔓 Step 3: Example token approval...');
    console.log('Note: This would fail if you have no tokens, but shows the pattern');
    
    const approvalExample = await mcpClient.callTool('approve_wallet_token', {
      token: token,
      chainId: 8453, // Base chain
      tokenAddress: '0xA0b86a33E6441c7eca3cf51d4ae1ee9F8e9Cf8a', // Example USDC
      amount: '1000000000' // 1000 USDC (6 decimals)
    });

    if (approvalExample.success) {
      console.log('✅ Token approval successful!');
      console.log(`   TX Hash: ${approvalExample.data.txHash}`);
    } else {
      console.log(`ℹ️  Token approval example: ${approvalExample.error}`);
      console.log('   (This is expected if you have no tokens to approve)');
    }

    // Step 4: Example swap (would fail without tokens, but shows pattern)
    console.log('\n🔄 Step 4: Example token swap...');
    console.log('Note: This would fail without tokens, but shows the trading pattern');

    const swapExample = await mcpClient.callTool('execute_wallet_swap', {
      token: token,
      chainId: 8453,
      fromToken: 'USDC',
      toToken: 'ETH',
      amount: '100000000', // 100 USDC
      slippage: 0.5,
      deadline: 20
    });

    if (swapExample.success) {
      console.log('✅ Swap executed successfully!');
      console.log(`   TX Hash: ${swapExample.data.txHash}`);
      console.log(`   Explorer: ${swapExample.data.explorerUrl}`);
    } else {
      console.log(`ℹ️  Swap example: ${swapExample.error}`);
      console.log('   (This is expected if you have no tokens to swap)');
    }

    // Step 5: Get private credentials when needed
    console.log('\n🔑 Step 5: Retrieving private credentials...');
    const credentials = await mcpClient.callTool('get_wallet_private_key', {
      token: token
    });

    if (credentials.success) {
      console.log('✅ Credentials retrieved successfully');
      console.log('   Use these to import into other wallets if needed');
    }

    // Step 6: Proper logout
    console.log('\n🚪 Step 6: Logging out securely...');
    const logout = await mcpClient.callTool('logout_wallet', {
      token: token
    });

    if (logout.success) {
      console.log('✅ Logged out successfully');
      console.log('   Session ended securely');
    }

    console.log('\n🎉 Auto-Wallet Example Complete!');
    console.log('===============================');
    console.log('\n📋 Summary of Benefits:');
    console.log('✅ No external wallet needed (MetaMask, WalletConnect)');
    console.log('✅ Secure auto-generated wallet per user');
    console.log('✅ Direct control of private keys');
    console.log('✅ Session-based authentication');
    console.log('✅ Isolated user experience');
    console.log('✅ Enhanced security - no browser extension risks');

  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Usage instructions
console.log(`
📚 How to use this example:

1. Set up your MCP client
2. Call: autoWalletExample(mcpClient)
3. Save the private key and mnemonic safely
4. Fund your wallet address to start trading
5. Use the auth token for all trading operations

🔗 Next Steps:
- Fund your wallet with native tokens for gas
- Transfer tokens to trade with
- Use the auth token for all trading operations
- Import private key to other wallets if needed

🔒 Security Reminders:
- Save private key and mnemonic offline
- Never share your credentials with anyone
- Use the auth token for MCP operations only
- Log out when finished trading
`);

module.exports = { autoWalletExample }; 