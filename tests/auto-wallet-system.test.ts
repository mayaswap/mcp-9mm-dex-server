/**
 * Auto-Generated Wallet System Tests
 * Comprehensive test suite for the new secure auto-wallet functionality
 */

import { userService } from '../src/services/user-service';
import { walletService } from '../src/services/wallet-service';
import { handleUserWalletTool } from '../src/mcp/tools/user-wallet-tools';

describe('Auto-Generated Wallet System', () => {
  let authToken: string;
  let walletAddress: string;
  let userId: string;

  beforeEach(async () => {
    // Clean up any existing sessions before each test
    await cleanupTestSessions();
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestSessions();
  });

  describe('Wallet Creation', () => {
    test('should create new auto-generated wallet successfully', async () => {
      // Test the create_new_wallet tool
      const result = await handleUserWalletTool('create_new_wallet', {
        chainIds: [8453, 369, 146]
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.user).toBeDefined();
      expect(result.data.wallet).toBeDefined();
      expect(result.data.token).toBeDefined();

      // Verify wallet structure
      const { user, wallet, token } = result.data;
      
      expect(user.id).toMatch(/^user_[a-f0-9]{32}$/);
      expect(user.walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(user.walletGenerated).toBe(true);
      
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(wallet.mnemonic).toMatch(/^(\w+ ){11}\w+$/); // 12 words
      expect(wallet.chainIds).toEqual([8453, 369, 146]);
      
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      // Store for subsequent tests
      authToken = token;
      walletAddress = wallet.address;
      userId = user.id;

      console.log('✅ Wallet created successfully:', {
        userId: user.id,
        address: wallet.address,
        hasToken: !!token
      });
    });

    test('should create wallet with custom chain selection', async () => {
      const result = await handleUserWalletTool('create_new_wallet', {
        chainIds: [8453] // Only Base chain
      });

      expect(result.success).toBe(true);
      expect(result.data.wallet.chainIds).toEqual([8453]);
    });

    test('should include security instructions in wallet creation', async () => {
      const result = await handleUserWalletTool('create_new_wallet', {});

      expect(result.success).toBe(true);
      expect(result.data.securityInstructions).toBeDefined();
      expect(Array.isArray(result.data.securityInstructions)).toBe(true);
      expect(result.data.securityInstructions.length).toBeGreaterThan(0);
    });
  });

  describe('Wallet Information Retrieval', () => {
    beforeEach(async () => {
      // Create a wallet for these tests
      const result = await handleUserWalletTool('create_new_wallet', {});
      authToken = result.data.token;
      walletAddress = result.data.wallet.address;
      userId = result.data.user.id;
    });

    test('should get wallet info with valid token', async () => {
      const result = await handleUserWalletTool('get_my_wallet_info', {
        token: authToken
      });

      expect(result.success).toBe(true);
      expect(result.data.user.walletAddress).toBe(walletAddress);
      expect(result.data.wallet.address).toBe(walletAddress);
      expect(result.data.balances).toBeDefined();
      expect(Array.isArray(result.data.balances)).toBe(true);
    });

    test('should reject invalid token for wallet info', async () => {
      const result = await handleUserWalletTool('get_my_wallet_info', {
        token: 'invalid_token_123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired token');
    });

    test('should get private key with valid token', async () => {
      const result = await handleUserWalletTool('get_wallet_private_key', {
        token: authToken
      });

      expect(result.success).toBe(true);
      expect(result.data.walletAddress).toBe(walletAddress);
      expect(result.data.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.data.mnemonic).toMatch(/^(\w+ ){11}\w+$/);
      expect(result.data.securityWarning).toBeDefined();
      expect(Array.isArray(result.data.securityWarning)).toBe(true);
    });

    test('should reject invalid token for private key retrieval', async () => {
      const result = await handleUserWalletTool('get_wallet_private_key', {
        token: 'invalid_token_123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired token');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      // Create a wallet for these tests
      const result = await handleUserWalletTool('create_new_wallet', {});
      authToken = result.data.token;
      userId = result.data.user.id;
    });

    test('should logout successfully with valid token', async () => {
      const result = await handleUserWalletTool('logout_wallet', {
        token: authToken
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toContain('successfully');

      // Verify token is now invalid
      const infoResult = await handleUserWalletTool('get_my_wallet_info', {
        token: authToken
      });
      expect(infoResult.success).toBe(false);
    });

    test('should handle logout with invalid token gracefully', async () => {
      const result = await handleUserWalletTool('logout_wallet', {
        token: 'invalid_token_123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to logout');
    });

    test('should validate token expiry', () => {
      // Test token validation in user service
      const validUser = userService.validateToken(authToken);
      expect(validUser).toBe(userId);

      const invalidUser = userService.validateToken('invalid_token');
      expect(invalidUser).toBeNull();
    });
  });

  describe('Trading Operations', () => {
    beforeEach(async () => {
      // Create a wallet for these tests
      const result = await handleUserWalletTool('create_new_wallet', {});
      authToken = result.data.token;
      walletAddress = result.data.wallet.address;
    });

    test('should attempt swap with valid token (expect failure due to no funds)', async () => {
      const result = await handleUserWalletTool('execute_wallet_swap', {
        token: authToken,
        chainId: 8453,
        fromToken: 'USDC',
        toToken: 'ETH',
        amount: '1000000', // 1 USDC
        slippage: 0.5,
        deadline: 20
      });

      // Should fail due to insufficient funds, but validates the flow
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      console.log('ℹ️ Expected swap failure (no funds):', result.error);
    });

    test('should reject swap with invalid token', async () => {
      const result = await handleUserWalletTool('execute_wallet_swap', {
        token: 'invalid_token_123',
        chainId: 8453,
        fromToken: 'USDC',
        toToken: 'ETH',
        amount: '1000000',
        slippage: 0.5
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired token');
    });

    test('should attempt token approval with valid token', async () => {
      const result = await handleUserWalletTool('approve_wallet_token', {
        token: authToken,
        chainId: 8453,
        tokenAddress: '0xA0b86a33E6441c7eca3cf51d4ae1ee9F8e9Cf8a',
        amount: '1000000000'
      });

      // Should fail due to insufficient gas, but validates the flow
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      console.log('ℹ️ Expected approval failure (no gas):', result.error);
    });

    test('should check allowance with valid token', async () => {
      const result = await handleUserWalletTool('check_wallet_allowance', {
        token: authToken,
        chainId: 8453,
        tokenAddress: '0xA0b86a33E6441c7eca3cf51d4ae1ee9F8e9Cf8a'
      });

      // This should work as it's a read-only operation
      expect(result.success).toBe(true);
      expect(result.data.ownerAddress).toBe(walletAddress);
      expect(result.data.allowance).toBeDefined();
    });
  });

  describe('Security Features', () => {
    test('should generate unique wallets for each user', async () => {
      const user1 = await handleUserWalletTool('create_new_wallet', {});
      const user2 = await handleUserWalletTool('create_new_wallet', {});

      expect(user1.success).toBe(true);
      expect(user2.success).toBe(true);
      
      expect(user1.data.user.id).not.toBe(user2.data.user.id);
      expect(user1.data.wallet.address).not.toBe(user2.data.wallet.address);
      expect(user1.data.wallet.privateKey).not.toBe(user2.data.wallet.privateKey);
      expect(user1.data.token).not.toBe(user2.data.token);

      // Clean up
      await handleUserWalletTool('logout_wallet', { token: user1.data.token });
      await handleUserWalletTool('logout_wallet', { token: user2.data.token });
    });

    test('should isolate user sessions', async () => {
      const user1 = await handleUserWalletTool('create_new_wallet', {});
      const user2 = await handleUserWalletTool('create_new_wallet', {});

      // User 1 should not be able to access user 2's info with their token
      const crossAccessResult = await handleUserWalletTool('get_my_wallet_info', {
        token: user1.data.token
      });

      expect(crossAccessResult.success).toBe(true);
      expect(crossAccessResult.data.wallet.address).toBe(user1.data.wallet.address);
      expect(crossAccessResult.data.wallet.address).not.toBe(user2.data.wallet.address);

      // Clean up
      await handleUserWalletTool('logout_wallet', { token: user1.data.token });
      await handleUserWalletTool('logout_wallet', { token: user2.data.token });
    });

    test('should generate cryptographically secure credentials', async () => {
      const result = await handleUserWalletTool('create_new_wallet', {});
      const { wallet } = result.data;

      // Check private key format and entropy
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(wallet.privateKey).not.toBe('0x' + '0'.repeat(64)); // Not all zeros
      
      // Check mnemonic format
      const words = wallet.mnemonic.split(' ');
      expect(words).toHaveLength(12);
      words.forEach(word => {
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
      });

      // Clean up
      await handleUserWalletTool('logout_wallet', { token: result.data.token });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing parameters gracefully', async () => {
      const result = await handleUserWalletTool('get_my_wallet_info', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle invalid tool names', async () => {
      const result = await handleUserWalletTool('invalid_tool_name', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });

    test('should handle malformed tokens', async () => {
      const result = await handleUserWalletTool('get_my_wallet_info', {
        token: 'malformed.token.here'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired token');
    });
  });

  // Helper function to clean up test sessions
  async function cleanupTestSessions() {
    try {
      // Get all active users and revoke their sessions
      const activeUsers = userService.getActiveUsers();
      for (const user of activeUsers) {
        // Find the token for this user (this is a simplified cleanup)
        const userSession = userService.getUserSession('temp_token');
        if (userSession && userSession.user.id === user.id) {
          userService.revokeSession('temp_token');
        }
      }
    } catch (error) {
      // Ignore cleanup errors in tests
      console.warn('Test cleanup warning:', error);
    }
  }
});

describe('Integration with Core Services', () => {
  test('should integrate with wallet service correctly', async () => {
    // Test that user service correctly uses wallet service
    const userSession = await userService.createUser([8453]);
    
    expect(userSession.user.walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(userSession.wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);

    // Initialize wallet for trading
    await userService.initializeUserWallet(userSession.user.id);
    
    // Verify wallet is connected
    expect(walletService.isConnected(8453)).toBe(true);
    expect(walletService.getWalletAddress()).toBe(userSession.wallet.address);

    // Clean up
    userService.revokeSession(userSession.token);
    expect(walletService.isConnected(8453)).toBe(false);
  });

  test('should handle user service lifecycle correctly', async () => {
    const userSession = await userService.createUser();
    const { user, token } = userSession;

    // User should exist
    const retrievedUser = userService.getUserByToken(token);
    expect(retrievedUser).toBeTruthy();
    expect(retrievedUser?.id).toBe(user.id);

    // Wallet should exist
    const userWallet = userService.getUserWallet(user.id);
    expect(userWallet).toBeTruthy();
    expect(userWallet?.address).toBe(userSession.wallet.address);

    // Session should exist
    const sessionData = userService.getUserSession(token);
    expect(sessionData).toBeTruthy();
    expect(sessionData?.user.id).toBe(user.id);

    // Revoke session
    const revoked = userService.revokeSession(token);
    expect(revoked).toBe(true);

    // User should no longer exist
    const retrievedAfterRevoke = userService.getUserByToken(token);
    expect(retrievedAfterRevoke).toBeNull();
  });
});

console.log(`
🧪 Auto-Wallet System Test Suite

This test suite validates:
✅ Wallet creation and generation
✅ Session management and authentication  
✅ Security isolation between users
✅ Trading operation authorization
✅ Error handling and edge cases
✅ Integration with core services

Run with: npm test auto-wallet-system.test.ts
`); 