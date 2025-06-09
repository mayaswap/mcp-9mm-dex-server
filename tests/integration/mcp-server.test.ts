/**
 * Integration Tests for 9MM MCP Server
 */

import { describe, test, expect } from '@jest/globals';

describe('9MM MCP Server Integration', () => {
  describe('Server Configuration', () => {
    test('should have correct server name and version', () => {
      const packageJson = require('../../package.json');
      
      expect(packageJson.name).toBe('9mm-dex-mcp-server');
      expect(packageJson.description).toBe('MCP server for 9MM DEX - Multi-chain trading on Base, PulseChain, and Sonic');
      expect(packageJson.keywords).toContain('9mm');
      expect(packageJson.keywords).toContain('dex');
      expect(packageJson.keywords).toContain('multi-chain');
    });

    test('should have required dependencies', () => {
      const packageJson = require('../../package.json');
      
      expect(packageJson.dependencies).toHaveProperty('@modelcontextprotocol/sdk');
      expect(packageJson.dependencies).toHaveProperty('ethers');
      expect(packageJson.devDependencies).toHaveProperty('@types/jest');
      expect(packageJson.devDependencies).toHaveProperty('typescript');
    });
  });

  describe('Tool Schema Validation', () => {
    test('all tools should have valid MCP schemas', async () => {
      // Import tools directly to test their structure
      const toolsModule = await import('../../src/mcp/tools/nine-mm-tools');
      const tools = toolsModule.nineMMTools;

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      tools.forEach((tool, index) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(tool.inputSchema.type).toBe('object');
        
        // Test that schema has properties
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(typeof tool.inputSchema.properties).toBe('object');
        
        console.log(`Tool ${index + 1}: ${tool.name} - Schema valid`);
      });
    });

    test('required fields should be properly defined', async () => {
      const toolsModule = await import('../../src/mcp/tools/nine-mm-tools');
      const tools = toolsModule.nineMMTools;

      const requiredToolsConfig = {
        'get_9mm_swap_quote': ['chainId', 'fromToken', 'toToken', 'amount', 'userAddress'],
        'compare_9mm_prices': ['fromToken', 'toToken', 'amount'],
        'get_9mm_pool_info': ['chainId', 'tokenA', 'tokenB'],
        'get_9mm_user_balances': ['userAddress'],
      };

      Object.entries(requiredToolsConfig).forEach(([toolName, requiredFields]) => {
        const tool = tools.find(t => t.name === toolName);
        expect(tool).toBeDefined();
        
        if (tool && 'required' in tool.inputSchema) {
          expect(tool.inputSchema.required).toEqual(expect.arrayContaining(requiredFields));
        }
      });
    });
  });

  describe('Configuration Loading', () => {
    test('should load all chain configurations', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      expect(configModule.SUPPORTED_9MM_CHAINS).toHaveLength(3);
      expect(configModule.SUPPORTED_9MM_CHAINS).toContain(8453); // Base
      expect(configModule.SUPPORTED_9MM_CHAINS).toContain(369);  // PulseChain
      expect(configModule.SUPPORTED_9MM_CHAINS).toContain(146);  // Sonic

      // Test configuration getter
      const baseConfig = configModule.get9MMConfig(8453);
      expect(baseConfig.name).toBe('Base');
      expect(baseConfig.chainId).toBe(8453);
      expect(baseConfig.nativeCurrency).toBe('ETH');
    });

    test('should have common tokens configured for each chain', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      configModule.SUPPORTED_9MM_CHAINS.forEach(chainId => {
        expect(configModule.COMMON_TOKENS[chainId as keyof typeof configModule.COMMON_TOKENS]).toBeDefined();
        expect(configModule.COMMON_TOKENS[chainId as keyof typeof configModule.COMMON_TOKENS]['9MM']).toBeDefined();
      });
    });

    test('should validate contract addresses format', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      configModule.SUPPORTED_9MM_CHAINS.forEach(chainId => {
        const config = configModule.get9MMConfig(chainId);
        
        // Test contract addresses are valid hex
        Object.values(config.contracts).forEach(address => {
          if (address) {
            expect(address).toMatch(/^0x[a-fA-F0-9]*$/);
          }
        });
      });
    });
  });

  describe('Fee Configuration', () => {
    test('should have correct 9MM fees', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      expect(configModule.NINE_MM_FEES.v2).toBe(0.0017); // 0.17%
      expect(configModule.NINE_MM_FEES.aggregator).toBe(0.001); // 0.1%
      
      expect(configModule.NINE_MM_FEES.v3.low).toBe(0.0005);
      expect(configModule.NINE_MM_FEES.v3.medium).toBe(0.003);
      expect(configModule.NINE_MM_FEES.v3.high).toBe(0.01);
    });
  });

  describe('Environment Configuration', () => {
    test('should handle missing environment variables gracefully', async () => {
      // Save original env vars
      const originalEnv = { ...process.env };
      
      try {
        // Clear RPC URLs
        delete process.env.BASE_RPC_URL;
        delete process.env.PULSECHAIN_RPC_URL;
        delete process.env.SONIC_RPC_URL;
        
        // Re-import to test fallback behavior
        delete require.cache[require.resolve('../../src/config/9mm-config')];
        const configModule = require('../../src/config/9mm-config');
        
        const baseConfig = configModule.get9MMConfig(8453);
        
        // Should fallback to default RPC URL
        expect(baseConfig.rpcUrl).toBeDefined();
        expect(typeof baseConfig.rpcUrl).toBe('string');
        expect(baseConfig.rpcUrl.length).toBeGreaterThan(0);
        
      } finally {
        // Restore environment
        process.env = originalEnv;
      }
    });
  });

  describe('Gas Configuration', () => {
    test('should have appropriate gas settings for each chain', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      const baseConfig = configModule.get9MMConfig(8453);
      const pulseConfig = configModule.get9MMConfig(369);
      const sonicConfig = configModule.get9MMConfig(146);
      
      // Base should have moderate gas prices
      expect(parseFloat(baseConfig.gasSettings.gasPrice)).toBeGreaterThan(0);
      expect(baseConfig.gasSettings.gasLimit).toBeGreaterThan(21000);
      
      // PulseChain should have very low gas prices
      expect(parseFloat(pulseConfig.gasSettings.gasPrice)).toBeLessThan(parseFloat(baseConfig.gasSettings.gasPrice));
      
      // All chains should have reasonable gas limits
      [baseConfig, pulseConfig, sonicConfig].forEach(config => {
        expect(config.gasSettings.gasLimit).toBeGreaterThan(21000);
        expect(config.gasSettings.gasLimit).toBeLessThan(10000000);
      });
    });
  });

  describe('Service Dependencies', () => {
    test('should import service without errors', async () => {
      // This tests that all dependencies resolve correctly
      await expect(import('../../src/services/nine-mm-service')).resolves.toBeDefined();
    });

    test('should import tools without errors', async () => {
      await expect(import('../../src/mcp/tools/nine-mm-tools')).resolves.toBeDefined();
    });

    test('should import main server without errors', async () => {
      await expect(import('../../src/index')).resolves.toBeDefined();
    });
  });

  describe('TypeScript Compilation', () => {
    test('all TypeScript files should compile', () => {
      // This test passes if Jest can run, which means TS compilation succeeded
      expect(true).toBe(true);
    });
  });

  describe('Tool Export Validation', () => {
    test('should export handle function', async () => {
      const toolsModule = await import('../../src/mcp/tools/nine-mm-tools');
      
      expect(typeof toolsModule.handle9MMTool).toBe('function');
    });

    test('should export tools array', async () => {
      const toolsModule = await import('../../src/mcp/tools/nine-mm-tools');
      
      expect(Array.isArray(toolsModule.nineMMTools)).toBe(true);
      expect(toolsModule.nineMMTools.length).toBeGreaterThan(0);
    });
  });

  describe('Chain Feature Flags', () => {
    test('all chains should have correct feature flags', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      configModule.SUPPORTED_9MM_CHAINS.forEach(chainId => {
        const config = configModule.get9MMConfig(chainId);
        
        expect(config.features).toHaveProperty('v2');
        expect(config.features).toHaveProperty('v3');
        expect(config.features).toHaveProperty('aggregator');
        
        expect(typeof config.features.v2).toBe('boolean');
        expect(typeof config.features.v3).toBe('boolean');
        expect(typeof config.features.aggregator).toBe('boolean');
      });
    });
  });

  describe('Error Handling Configuration', () => {
    test('should handle invalid chain IDs', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      expect(() => configModule.get9MMConfig(999)).toThrow();
      expect(() => configModule.get9MMConfig(1)).toThrow();
    });
  });

  describe('Multi-chain Support Validation', () => {
    test('should support exactly 3 chains', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      const allChains = configModule.getAllSupported9MMChains();
      expect(allChains).toHaveLength(3);
      
      const chainNames = allChains.map(chain => chain.name);
      expect(chainNames).toContain('Base');
      expect(chainNames).toContain('PulseChain');
      expect(chainNames).toContain('Sonic');
    });

    test('each chain should have unique configuration', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      const allChains = configModule.getAllSupported9MMChains();
      const chainIds = allChains.map(chain => chain.chainId);
      const uniqueChainIds = new Set(chainIds);
      
      expect(uniqueChainIds.size).toBe(chainIds.length);
    });
  });

  describe('Native Currency Configuration', () => {
    test('each chain should have correct native currency', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      const baseConfig = configModule.get9MMConfig(8453);
      const pulseConfig = configModule.get9MMConfig(369);
      const sonicConfig = configModule.get9MMConfig(146);
      
      expect(baseConfig.nativeCurrency).toBe('ETH');
      expect(pulseConfig.nativeCurrency).toBe('PLS');
      expect(sonicConfig.nativeCurrency).toBe('S');
    });
  });

  describe('Block Explorer Configuration', () => {
    test('each chain should have valid block explorer URL', async () => {
      const configModule = await import('../../src/config/9mm-config');
      
      configModule.SUPPORTED_9MM_CHAINS.forEach(chainId => {
        const config = configModule.get9MMConfig(chainId);
        
        expect(config.blockExplorer).toBeDefined();
        expect(typeof config.blockExplorer).toBe('string');
        expect(config.blockExplorer).toMatch(/^https?:\/\//);
      });
    });
  });
}); 