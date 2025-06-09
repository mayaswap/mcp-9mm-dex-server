/**
 * User Service
 * Manages user sessions and automatically generated wallets for secure trading
 */

import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { walletService } from './wallet-service.js';

export interface IUser {
  id: string;
  sessionId: string;
  createdAt: Date;
  lastActive: Date;
  walletAddress: string;
  walletGenerated: boolean;
}

export interface IUserWallet {
  address: string;
  privateKey: string;
  mnemonic: string;
  chainIds: number[];
  createdAt: Date;
}

export interface IUserSession {
  user: IUser;
  wallet: IUserWallet;
  token: string;
}

export class UserService {
  private users: Map<string, IUser> = new Map(); // userId -> User
  private userWallets: Map<string, IUserWallet> = new Map(); // userId -> Wallet
  private sessionTokens: Map<string, string> = new Map(); // token -> userId
  private userSessions: Map<string, string> = new Map(); // sessionId -> userId

  constructor() {
    logger.info('User service initialized - Auto-wallet generation enabled');
    
    // Clean up expired sessions every hour
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * Create a new user with auto-generated wallet
   */
  async createUser(chainIds: number[] = [8453, 369, 146]): Promise<IUserSession> {
    try {
      const userId = this.generateUserId();
      const sessionId = this.generateSessionId();

      // Generate wallet for the user
      const walletData = await walletService.generateWallet(chainIds);

      const user: IUser = {
        id: userId,
        sessionId,
        createdAt: new Date(),
        lastActive: new Date(),
        walletAddress: walletData.address,
        walletGenerated: true,
      };

      const userWallet: IUserWallet = {
        address: walletData.address,
        privateKey: walletData.privateKey,
        mnemonic: walletData.mnemonic,
        chainIds,
        createdAt: new Date(),
      };

      // Generate JWT token
      const token = this.generateJWTToken(userId);

      // Store user data
      this.users.set(userId, user);
      this.userWallets.set(userId, userWallet);
      this.sessionTokens.set(token, userId);
      this.userSessions.set(sessionId, userId);

      logger.info(`New user created with auto-generated wallet: ${user.id} -> ${user.walletAddress}`);

      return {
        user,
        wallet: userWallet,
        token,
      };

    } catch (error) {
      logger.error('Failed to create user with auto-generated wallet:', error);
      throw error;
    }
  }

  /**
   * Get user by token
   */
  getUserByToken(token: string): IUser | null {
    try {
      const userId = this.sessionTokens.get(token);
      if (!userId) return null;

      const user = this.users.get(userId);
      if (user) {
        // Update last active
        user.lastActive = new Date();
        this.users.set(userId, user);
      }

      return user || null;
    } catch (error) {
      logger.error('Failed to get user by token:', error);
      return null;
    }
  }

  /**
   * Get user wallet by user ID
   */
  getUserWallet(userId: string): IUserWallet | null {
    return this.userWallets.get(userId) || null;
  }

  /**
   * Get user session (user + wallet + token)
   */
  getUserSession(token: string): IUserSession | null {
    const userId = this.sessionTokens.get(token);
    if (!userId) return null;

    const user = this.users.get(userId);
    const wallet = this.userWallets.get(userId);

    if (!user || !wallet) return null;

    return {
      user,
      wallet,
      token,
    };
  }

  /**
   * Validate JWT token and return user ID
   */
  validateToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
      const user = this.users.get(decoded.userId);
      
      if (user) {
        // Update last active
        user.lastActive = new Date();
        this.users.set(decoded.userId, user);
        return decoded.userId;
      }
      
      return null;
    } catch (error) {
      logger.warn('Invalid token:', error);
      return null;
    }
  }

  /**
   * Revoke user session
   */
  revokeSession(token: string): boolean {
    try {
      const userId = this.sessionTokens.get(token);
      if (!userId) return false;

      const user = this.users.get(userId);
      if (user) {
        // Disconnect wallet from all chains
        walletService.disconnectWallet();
        
        // Remove session data
        this.sessionTokens.delete(token);
        this.userSessions.delete(user.sessionId);
        this.users.delete(userId);
        this.userWallets.delete(userId);

        logger.info(`User session revoked: ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to revoke session:', error);
      return false;
    }
  }

  /**
   * Get all active users (for admin purposes)
   */
  getActiveUsers(): IUser[] {
    return Array.from(this.users.values())
      .filter(user => this.isSessionActive(user))
      .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
  }

  /**
   * Get user wallet balances
   */
  async getUserBalances(userId: string): Promise<any> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Import the user's wallet into wallet service temporarily
    const userWallet = this.userWallets.get(userId);
    if (!userWallet) {
      throw new Error('User wallet not found');
    }

    await walletService.importWallet({
      privateKey: userWallet.privateKey,
    }, userWallet.chainIds);

    // Get balances
    const walletInfos = await walletService.getWalletInfo();
    
    return walletInfos;
  }

  /**
   * Initialize user wallet for trading
   */
  async initializeUserWallet(userId: string): Promise<void> {
    const userWallet = this.userWallets.get(userId);
    if (!userWallet) {
      throw new Error('User wallet not found');
    }

    // Import wallet into wallet service for trading operations
    await walletService.importWallet({
      privateKey: userWallet.privateKey,
    }, userWallet.chainIds);

    logger.info(`User wallet initialized for trading: ${userId} -> ${userWallet.address}`);
  }

  /**
   * Private helper methods
   */
  private generateUserId(): string {
    return 'user_' + randomBytes(16).toString('hex');
  }

  private generateSessionId(): string {
    return 'session_' + randomBytes(16).toString('hex');
  }

  private generateJWTToken(userId: string): string {
    try {
      const secret = config.jwtSecret as string;
      return jwt.sign({ userId }, secret);
    } catch (error) {
      logger.error('Failed to generate JWT token:', error);
      throw new Error('Token generation failed');
    }
  }

  private isSessionActive(user: IUser): boolean {
    const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours
    return (Date.now() - user.lastActive.getTime()) < maxInactiveTime;
  }

  private cleanupExpiredSessions(): void {
    let cleanedUp = 0;
    
    for (const [userId, user] of this.users.entries()) {
      if (!this.isSessionActive(user)) {
        // Clean up expired session
        this.sessionTokens.forEach((mappedUserId, token) => {
          if (mappedUserId === userId) {
            this.sessionTokens.delete(token);
          }
        });
        
        this.userSessions.delete(user.sessionId);
        this.users.delete(userId);
        this.userWallets.delete(userId);
        cleanedUp++;
      }
    }

    if (cleanedUp > 0) {
      logger.info(`Cleaned up ${cleanedUp} expired user sessions`);
    }
  }
}

export const userService = new UserService(); 