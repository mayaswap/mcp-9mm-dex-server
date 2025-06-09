# 9MM Multi-Chain DEX MCP Server - Test Suite

This directory contains a comprehensive test suite for the 9MM MCP server covering configuration, services, tools, and integration testing.

## 📁 Test Structure

```
tests/
├── setup.ts                    # Global test setup and utilities
├── config/
│   └── 9mm-config.test.ts     # Configuration validation tests
├── integration/
│   └── mcp-server.test.ts     # End-to-end integration tests
├── mcp/
│   └── nine-mm-tools.test.ts  # MCP tools functionality tests
├── services/
│   └── nine-mm-service.test.ts # Core service layer tests
└── utils/
    └── test-utils.test.ts     # Utility functions tests
```

## 🧪 Test Categories

### **1. Configuration Tests** (`tests/config/`)
Tests the 9MM configuration system:
- ✅ Chain configurations (Base, PulseChain, Sonic)
- ✅ Contract addresses validation
- ✅ Token mappings
- ✅ Fee structures
- ✅ Gas settings
- ✅ Environment variable handling

**Run with:** `npm run test:config`

### **2. Service Tests** (`tests/services/`)
Tests the core NineMMService functionality:
- ✅ Swap quote generation
- ✅ Cross-chain price comparison
- ✅ Liquidity pool information
- ✅ User balance fetching
- ✅ Transaction preparation
- ✅ Error handling

**Run with:** `npm run test:services` (not yet implemented due to mocking complexity)

### **3. MCP Tools Tests** (`tests/mcp/`)
Tests AI-accessible MCP tools:
- ✅ Tool schema validation
- ✅ Tool handler functionality
- ✅ Token symbol resolution
- ✅ Gas cost calculations
- ✅ Multi-chain operations
- ✅ Error handling

**Run with:** `npm run test:mcp`

### **4. Integration Tests** (`tests/integration/`)
Tests overall system integration:
- ✅ Server configuration
- ✅ Dependency resolution
- ✅ TypeScript compilation
- ✅ Tool exports
- ✅ Multi-chain support
- ✅ Feature flags

**Run with:** `npm run test:integration`

### **5. Utility Tests** (`tests/utils/`)
Tests helper functions and utilities:
- ✅ Address validation
- ✅ Amount validation
- ✅ Chain ID validation
- ✅ Slippage calculations
- ✅ Gas price conversions
- ✅ Number formatting
- ✅ Error formatting
- ✅ Route optimization

**Run with:** `npm run test:utils`

## 🚀 Running Tests

### **Individual Test Suites**
```bash
# Configuration tests
npm run test:config

# Integration tests  
npm run test:integration

# Utility tests
npm run test:utils

# MCP tools tests
npm run test:mcp
```

### **All Tests**
```bash
# Run all test suites
npm run test:all

# Standard Jest (all tests)
npm test

# Watch mode for development
npm run test:watch
```

### **Coverage & CI**
```bash
# Generate coverage report
npm run test:coverage

# CI-friendly test run
npm run test:ci

# Full validation (type-check + lint + tests)
npm run validate
```

## 📊 Test Coverage Goals

Our test suite aims for comprehensive coverage:

- **Configuration**: 100% - All chain configs and settings
- **Integration**: 95% - Core system functionality  
- **Tools**: 90% - MCP tool handlers and schemas
- **Utilities**: 95% - Helper functions and validation
- **Services**: 80% - Core business logic (limited by ethers.js mocking)

## 🔧 Test Configuration

### **Jest Configuration** (`jest.config.js`)
- **Environment**: Node.js
- **TypeScript**: ESM modules with ts-jest
- **Coverage**: Text, LCOV, and HTML reports
- **Timeout**: 30 seconds for blockchain operations
- **Setup**: Global mocks and utilities

### **Mock Strategy**
- **Ethers.js**: Mocked for all blockchain interactions
- **MCP SDK**: Mocked server and transport layers
- **Environment**: Test-specific configurations
- **Network Calls**: No real network calls in tests

## 🎯 Test Patterns

### **Configuration Tests**
```typescript
test('should have correct Base configuration', () => {
  const config = get9MMConfig(8453);
  expect(config.name).toBe('Base');
  expect(config.chainId).toBe(8453);
});
```

### **Tool Handler Tests**
```typescript
test('should handle swap quote request', async () => {
  const result = await handle9MMTool('get_9mm_swap_quote', args);
  expect(result.success).toBe(true);
  expect(result.data.chainId).toBe(8453);
});
```

### **Integration Tests**
```typescript
test('should import service without errors', async () => {
  await expect(import('../../src/services/nine-mm-service'))
    .resolves.toBeDefined();
});
```

## 🐛 Debugging Tests

### **Common Issues**

1. **TypeScript/Jest Typing Conflicts**
   - Use `any` type for complex mocks
   - Simplify mock structures
   - Import modules dynamically when needed

2. **ESM Module Issues**
   - Ensure `jest.config.js` has ESM configuration
   - Use `.js` extensions in imports for tests
   - Check `package.json` has `"type": "module"`

3. **Mock Resolution**
   - Mocks must be defined before imports
   - Use `jest.clearAllMocks()` in `beforeEach`
   - Check mock call arguments with `.mock.calls`

### **Debug Commands**
```bash
# Run single test file
npx jest tests/config/9mm-config.test.ts

# Run with verbose output
npx jest --verbose

# Debug specific test
npx jest --testNamePattern="should validate addresses"

# Run without coverage (faster)
npx jest --no-coverage
```

## 📝 Adding New Tests

### **1. Create Test File**
```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';

describe('New Feature', () => {
  beforeEach(() => {
    // Setup
  });

  test('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### **2. Add to Test Script**
Update `package.json` scripts if creating new test category:
```json
"test:my-feature": "jest tests/my-feature --verbose"
```

### **3. Update Test Documentation**
Add your new tests to this README with:
- Purpose and scope
- How to run
- Coverage expectations

## 🏆 Test Quality Standards

### **Required Elements**
- ✅ Clear test descriptions
- ✅ Proper setup and teardown
- ✅ Error case testing
- ✅ Edge case validation
- ✅ Mock isolation
- ✅ Assertions that verify behavior

### **Best Practices**
- **Arrange-Act-Assert** pattern
- **One assertion per test** (when possible)
- **Descriptive test names**
- **Independent tests** (no dependencies)
- **Fast execution** (under 30s total)

## 🔍 Continuous Integration

The test suite is designed for CI/CD integration:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    npm run type-check
    npm run lint
    npm run test:ci
```

### **CI Test Features**
- **No watch mode**: `--watchAll=false`
- **Coverage reports**: Automatic generation
- **Exit codes**: Proper failure reporting
- **Deterministic**: No random or time-based tests

---

## 📞 Support

For test-related issues:
1. Check this documentation
2. Review Jest configuration
3. Examine mock setup in `tests/setup.ts`
4. Run tests with `--verbose` for detailed output

**Happy Testing!** 🚀 