/**
 * Test Setup for 9MM MCP Server
 * Global test configuration and mocks
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.BASE_RPC_URL = 'https://base-mainnet.test.com';
process.env.PULSECHAIN_RPC_URL = 'https://rpc.pulsechain.test.com';
process.env.SONIC_RPC_URL = 'https://rpc.soniclabs.test.com';

// Disable console logs during tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
(global as any).testUtils = {
  sampleAddresses: {
    user: '0x742d35Cc6634C0532925a3b8D4431e5e04334aBb',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    weth: '0x4200000000000000000000000000000000000006',
    router: '0x1234567890abcdef1234567890abcdef12345678',
    factory: '0xabcdef1234567890abcdef1234567890abcdef12',
  },

  sampleSwapParams: {
    chainId: 8453,
    fromToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    toToken: '0x4200000000000000000000000000000000000006',
    amount: '1000000000',
    slippage: 0.5,
    userAddress: '0x742d35Cc6634C0532925a3b8D4431e5e04334aBb',
  },

  createMockProvider: () => ({
    getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
    getNetwork: jest.fn().mockResolvedValue({ chainId: 8453 }),
  }),

  createMockContract: () => ({
    getAmountsOut: jest.fn().mockResolvedValue(['1000000000', '2000000000000000000']),
    getReserves: jest.fn().mockResolvedValue({
      _reserve0: '5000000000000',
      _reserve1: '1750000000000000000',
    }),
    totalSupply: jest.fn().mockResolvedValue('2915475906000000'),
    balanceOf: jest.fn().mockResolvedValue('100000000000000000000'),
    getPair: jest.fn().mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678'),
    getFunction: jest.fn().mockReturnValue({
      estimateGas: jest.fn().mockResolvedValue('180000'),
    }),
  }),
}; 