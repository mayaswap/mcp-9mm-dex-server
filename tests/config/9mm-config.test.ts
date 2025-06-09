/**
 * Tests for 9MM Configuration
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { 
  get9MMConfig, 
  getAllSupported9MMChains, 
  SUPPORTED_9MM_CHAINS,
  CHAIN_9MM_CONFIGS,
  COMMON_TOKENS,
  NINE_MM_FEES 
} from '../../src/config/9mm-config';

describe('9MM Configuration', () => {
  describe('SUPPORTED_9MM_CHAINS', () => {
    test('should contain exactly 3 supported chains', () => {
      expect(SUPPORTED_9MM_CHAINS).toHaveLength(3);
      expect(SUPPORTED_9MM_CHAINS).toEqual([8453, 369, 146]);
    });

    test('should include Base, PulseChain, and Sonic chain IDs', () => {
      expect(SUPPORTED_9MM_CHAINS).toContain(8453); // Base
      expect(SUPPORTED_9MM_CHAINS).toContain(369);  // PulseChain
      expect(SUPPORTED_9MM_CHAINS).toContain(146);  // Sonic
    });
  });

  describe('CHAIN_9MM_CONFIGS', () => {
    test('should have config for all supported chains', () => {
      SUPPORTED_9MM_CHAINS.forEach(chainId => {
        expect(CHAIN_9MM_CONFIGS[chainId]).toBeDefined();
      });
    });

    describe('Base configuration (8453)', () => {
      const baseConfig = CHAIN_9MM_CONFIGS[8453];

      test('should have correct basic properties', () => {
        expect(baseConfig.chainId).toBe(8453);
        expect(baseConfig.name).toBe('Base');
        expect(baseConfig.nativeCurrency).toBe('ETH');
        expect(baseConfig.blockExplorer).toBe('https://basescan.org');
      });

      test('should have RPC URL defined', () => {
        expect(baseConfig.rpcUrl).toBeDefined();
        expect(typeof baseConfig.rpcUrl).toBe('string');
      });

      test('should have contract addresses structure', () => {
        expect(baseConfig.contracts).toBeDefined();
        expect(baseConfig.contracts).toHaveProperty('factory');
        expect(baseConfig.contracts).toHaveProperty('router');
        expect(baseConfig.contracts).toHaveProperty('multicall');
        expect(baseConfig.contracts).toHaveProperty('quoter');
        expect(baseConfig.contracts).toHaveProperty('positionManager');
      });

      test('should have correct features enabled', () => {
        expect(baseConfig.features.v2).toBe(true);
        expect(baseConfig.features.v3).toBe(true);
        expect(baseConfig.features.aggregator).toBe(true);
      });

      test('should have gas settings', () => {
        expect(baseConfig.gasSettings).toBeDefined();
        expect(baseConfig.gasSettings.gasPrice).toBe('0.1');
        expect(baseConfig.gasSettings.gasLimit).toBe(300000);
        expect(baseConfig.gasSettings.maxFeePerGas).toBe('0.2');
        expect(baseConfig.gasSettings.maxPriorityFeePerGas).toBe('0.01');
      });
    });

    describe('PulseChain configuration (369)', () => {
      const pulseConfig = CHAIN_9MM_CONFIGS[369];

      test('should have correct basic properties', () => {
        expect(pulseConfig.chainId).toBe(369);
        expect(pulseConfig.name).toBe('PulseChain');
        expect(pulseConfig.nativeCurrency).toBe('PLS');
        expect(pulseConfig.blockExplorer).toBe('https://scan.pulsechain.com');
      });

      test('should have very low gas price', () => {
        expect(pulseConfig.gasSettings.gasPrice).toBe('0.001');
        expect(parseFloat(pulseConfig.gasSettings.gasPrice)).toBeLessThan(0.01);
      });
    });

    describe('Sonic configuration (146)', () => {
      const sonicConfig = CHAIN_9MM_CONFIGS[146];

      test('should have correct basic properties', () => {
        expect(sonicConfig.chainId).toBe(146);
        expect(sonicConfig.name).toBe('Sonic');
        expect(sonicConfig.nativeCurrency).toBe('S');
        expect(sonicConfig.blockExplorer).toBe('https://scan.soniclabs.com');
      });

      test('should have moderate gas price', () => {
        expect(sonicConfig.gasSettings.gasPrice).toBe('0.01');
      });
    });
  });

  describe('get9MMConfig function', () => {
    test('should return correct config for valid chain IDs', () => {
      const baseConfig = get9MMConfig(8453);
      expect(baseConfig.name).toBe('Base');

      const pulseConfig = get9MMConfig(369);
      expect(pulseConfig.name).toBe('PulseChain');

      const sonicConfig = get9MMConfig(146);
      expect(sonicConfig.name).toBe('Sonic');
    });

    test('should throw error for unsupported chain ID', () => {
      expect(() => get9MMConfig(1)).toThrow('9MM not deployed on chain 1');
      expect(() => get9MMConfig(999)).toThrow('9MM not deployed on chain 999');
    });

    test('should return immutable config objects', () => {
      const config1 = get9MMConfig(8453);
      const config2 = get9MMConfig(8453);
      
      // Should return the same reference (cached)
      expect(config1).toBe(config2);
    });
  });

  describe('getAllSupported9MMChains function', () => {
    test('should return all supported chain configs', () => {
      const chains = getAllSupported9MMChains();
      expect(chains).toHaveLength(3);
      
      const chainIds = chains.map(chain => chain.chainId);
      expect(chainIds).toEqual(expect.arrayContaining([8453, 369, 146]));
    });

    test('should return configs with all required properties', () => {
      const chains = getAllSupported9MMChains();
      
      chains.forEach(chain => {
        expect(chain).toHaveProperty('chainId');
        expect(chain).toHaveProperty('name');
        expect(chain).toHaveProperty('nativeCurrency');
        expect(chain).toHaveProperty('rpcUrl');
        expect(chain).toHaveProperty('blockExplorer');
        expect(chain).toHaveProperty('contracts');
        expect(chain).toHaveProperty('features');
        expect(chain).toHaveProperty('gasSettings');
      });
    });
  });

  describe('COMMON_TOKENS', () => {
    test('should have tokens for all supported chains', () => {
      expect(COMMON_TOKENS[8453]).toBeDefined(); // Base
      expect(COMMON_TOKENS[369]).toBeDefined();  // PulseChain
      expect(COMMON_TOKENS[146]).toBeDefined();  // Sonic
    });

    test('Base tokens should include standard tokens', () => {
      const baseTokens = COMMON_TOKENS[8453];
      expect(baseTokens).toHaveProperty('WETH');
      expect(baseTokens).toHaveProperty('USDC');
      expect(baseTokens).toHaveProperty('USDT');
      expect(baseTokens).toHaveProperty('9MM');
      
      // Verify addresses are valid Ethereum addresses
      Object.values(baseTokens).forEach(address => {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      });
    });

    test('PulseChain tokens should include native tokens', () => {
      const pulseTokens = COMMON_TOKENS[369];
      expect(pulseTokens).toHaveProperty('WPLS');
      expect(pulseTokens).toHaveProperty('PLSX');
      expect(pulseTokens).toHaveProperty('9MM');
    });

    test('Sonic tokens should include native tokens', () => {
      const sonicTokens = COMMON_TOKENS[146];
      expect(sonicTokens).toHaveProperty('WS');
      expect(sonicTokens).toHaveProperty('USDC');
      expect(sonicTokens).toHaveProperty('9MM');
    });

    test('all chains should have 9MM token', () => {
      expect(COMMON_TOKENS[8453]['9MM']).toBeDefined();
      expect(COMMON_TOKENS[369]['9MM']).toBeDefined();
      expect(COMMON_TOKENS[146]['9MM']).toBeDefined();
    });
  });

  describe('NINE_MM_FEES', () => {
    test('should have correct fee structure', () => {
      expect(NINE_MM_FEES.v2).toBe(0.0017); // 0.17%
      expect(NINE_MM_FEES.aggregator).toBe(0.001); // 0.1%
    });

    test('should have V3 fee tiers', () => {
      expect(NINE_MM_FEES.v3.low).toBe(0.0005);    // 0.05%
      expect(NINE_MM_FEES.v3.medium).toBe(0.003);  // 0.3%
      expect(NINE_MM_FEES.v3.high).toBe(0.01);     // 1%
    });

    test('V2 fees should be lower than standard DEX fees', () => {
      const standardUniswapFee = 0.003; // 0.3%
      expect(NINE_MM_FEES.v2).toBeLessThan(standardUniswapFee);
    });

    test('fee values should be valid percentages', () => {
      expect(NINE_MM_FEES.v2).toBeGreaterThan(0);
      expect(NINE_MM_FEES.v2).toBeLessThan(1);
      
      expect(NINE_MM_FEES.aggregator).toBeGreaterThan(0);
      expect(NINE_MM_FEES.aggregator).toBeLessThan(1);
      
      Object.values(NINE_MM_FEES.v3).forEach(fee => {
        expect(fee).toBeGreaterThan(0);
        expect(fee).toBeLessThan(1);
      });
    });
  });

  describe('Environment variable handling', () => {
    beforeEach(() => {
      // Reset environment variables before each test
      delete process.env.BASE_RPC_URL;
      delete process.env.PULSECHAIN_RPC_URL;
      delete process.env.SONIC_RPC_URL;
    });

    test('should use environment variables when provided', () => {
      process.env.BASE_RPC_URL = 'https://custom-base-rpc.com';
      
      // Dynamically import to get fresh config with new env vars
      delete require.cache[require.resolve('../../src/config/9mm-config')];
      const { get9MMConfig: freshGet9MMConfig } = require('../../src/config/9mm-config');
      
      const config = freshGet9MMConfig(8453);
      expect(config.rpcUrl).toBe('https://custom-base-rpc.com');
    });

    test('should fallback to default URLs when env vars not provided', () => {
      const config = get9MMConfig(8453);
      expect(config.rpcUrl).toContain('alchemy.com');
    });
  });

  describe('Configuration validation', () => {
    test('all chain configs should have valid structure', () => {
      const requiredProperties = [
        'chainId', 'name', 'nativeCurrency', 'rpcUrl', 
        'blockExplorer', 'contracts', 'features', 'gasSettings'
      ];

      Object.values(CHAIN_9MM_CONFIGS).forEach(config => {
        requiredProperties.forEach(prop => {
          expect(config).toHaveProperty(prop);
        });
      });
    });

    test('contract addresses should be properly formatted', () => {
      Object.values(CHAIN_9MM_CONFIGS).forEach(config => {
        Object.values(config.contracts).forEach(address => {
          if (address) {
            expect(address).toMatch(/^0x[a-fA-F0-9]*$/);
          }
        });
      });
    });

    test('gas settings should have valid values', () => {
      Object.values(CHAIN_9MM_CONFIGS).forEach(config => {
        expect(typeof config.gasSettings.gasPrice).toBe('string');
        expect(typeof config.gasSettings.gasLimit).toBe('number');
        expect(config.gasSettings.gasLimit).toBeGreaterThan(0);
        
        const gasPrice = parseFloat(config.gasSettings.gasPrice);
        expect(gasPrice).toBeGreaterThan(0);
      });
    });
  });
}); 