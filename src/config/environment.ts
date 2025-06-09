/**
 * Environment Configuration
 * Centralized configuration management for the MCP EVM DEX server
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface EnvironmentConfig {
  // Server Configuration
  nodeEnv: string;
  port: number;
  
  // EVM Configuration
  evmNetworks: {
    ethereum: {
      chainId: number;
      name: string;
      rpcUrl: string;
      nativeCurrency: string;
    };
    polygon: {
      chainId: number;
      name: string;
      rpcUrl: string;
      nativeCurrency: string;
    };
    bsc: {
      chainId: number;
      name: string;
      rpcUrl: string;
      nativeCurrency: string;
    };
    arbitrum: {
      chainId: number;
      name: string;
      rpcUrl: string;
      nativeCurrency: string;
    };
    optimism: {
      chainId: number;
      name: string;
      rpcUrl: string;
      nativeCurrency: string;
    };
    base: {
      chainId: number;
      name: string;
      rpcUrl: string;
      nativeCurrency: string;
    };
  };
  
  // Security
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // API Keys
  apiKeys: {
    alchemy?: string;
    infura?: string;
    coinGecko?: string;
    oneInch?: string;
  };
  
  // Performance
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export const config: EnvironmentConfig = {
  // Server Configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  // EVM Networks Configuration
  evmNetworks: {
    ethereum: {
      chainId: 1,
      name: 'Ethereum',
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
      nativeCurrency: 'ETH',
    },
    polygon: {
      chainId: 137,
      name: 'Polygon',
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.alchemyapi.io/v2/your-api-key',
      nativeCurrency: 'MATIC',
    },
    bsc: {
      chainId: 56,
      name: 'BSC',
      rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
      nativeCurrency: 'BNB',
    },
    arbitrum: {
      chainId: 42161,
      name: 'Arbitrum',
      rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb-mainnet.g.alchemy.com/v2/your-api-key',
      nativeCurrency: 'ETH',
    },
    optimism: {
      chainId: 10,
      name: 'Optimism',
      rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://opt-mainnet.g.alchemy.com/v2/your-api-key',
      nativeCurrency: 'ETH',
    },
    base: {
      chainId: 8453,
      name: 'Base',
      rpcUrl: process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/your-api-key',
      nativeCurrency: 'ETH',
    },
  },
  
  // Security Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // External API Keys
  apiKeys: {
    ...(process.env.ALCHEMY_API_KEY && { alchemy: process.env.ALCHEMY_API_KEY }),
    ...(process.env.INFURA_API_KEY && { infura: process.env.INFURA_API_KEY }),
    ...(process.env.COINGECKO_API_KEY && { coinGecko: process.env.COINGECKO_API_KEY }),
    ...(process.env.ONEINCH_API_KEY && { oneInch: process.env.ONEINCH_API_KEY }),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

/**
 * Validate required environment variables
 */
export function validateEnvironment(): void {
  const requiredVars = ['NODE_ENV'];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Warn about missing API keys in production
  if (config.nodeEnv === 'production') {
    const missingApiKeys = Object.entries(config.apiKeys)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    if (missingApiKeys.length > 0) {
      console.warn(`⚠️  Missing API keys in production: ${missingApiKeys.join(', ')}`);
    }
  }
} 