/**
 * 9MM DEX Multi-Chain Configuration
 * Contract addresses and settings for all 9MM deployments
 */

export interface I9MMChainConfig {
  chainId: number;
  name: string;
  nativeCurrency: string;
  rpcUrl: string;
  blockExplorer: string;
  contracts: {
    v2: {
      factory: string;
      router: string;
    };
    v3: {
      factory: string;
      router: string;
      multicall: string;
      quoter: string;
      positionManager: string;
      masterChef?: string;
      smartRouterHelper?: string;
      mixedRouteQuoter?: string;
      tokenValidator?: string;
      poolDeployer?: string;
      swapRouter?: string;
      migrator?: string;
      tickLens?: string;
      positionDescriptor?: string;
      lmPoolDeployer?: string;
    };
  };
  features: {
    v2: boolean;
    v3: boolean;
    aggregator: boolean;
  };
  gasSettings: {
    gasPrice: string; // in gwei
    gasLimit: number;
    maxFeePerGas?: string; // EIP-1559
    maxPriorityFeePerGas?: string; // EIP-1559
  };
}

export const CHAIN_9MM_CONFIGS: Record<number, I9MMChainConfig> = {
  // Base (Chain ID: 8453)
  8453: {
    chainId: 8453,
    name: 'Base',
    nativeCurrency: 'ETH',
    rpcUrl: process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo',
    blockExplorer: 'https://basescan.org',
    contracts: {
      v2: {
        factory: '0x4c1b8d4ae77a37b94e195cab316391d3c687ebd1', // PancakeSwap V2 Factory
        router: '0x00fECf89a9Ff8428901380fCA65B6f1BECCF9959', // PancakeSwap V2 Router
      },
      v3: {
        factory: '0x7b72C4002EA7c276dd717B96b20f4956c5C904E7', // V3Factory
        router: '0xFF112C8005E210Cb77D3EA0198a0dc3AE3ccC107', // SmartRouter
        multicall: '0x0e1FdDaA1252B9D7812bD9168fef793FDFA61904', // InterfaceMulticall
        quoter: '0xF26600E17728F41AdFb73D986E3deaf6Df29F1c4', // QuoterV2
        positionManager: '0x1409a523F5bE27989Af9321Cc0EC1d441ACa6d9B', // NonfungiblePositionManager
        masterChef: '0xF1603FCa23B7a97cEb3EE4c62576B7d5AF00f16C', // MasterChefV3
        smartRouterHelper: '0x35dA12E3a8C76dF1dA708df8529C06212B9Ea226', // SmartRouterHelper
        mixedRouteQuoter: '0x129a7BE772ea83E8ea60Fb746255B07be80E16fC', // MixedRouteQuoterV1
        tokenValidator: '0x1dF81DbcF49911F7F5368EA3e2ed2C6Bc270F3d3', // TokenValidator
        poolDeployer: '0x1Ac8FabC977426Ae83F5a17d9AF100b5BF09a429', // V3PoolDeployer
        swapRouter: '0xa07d063b595168e081B51280ada5fc8e11cDE52B', // SwapRouter
        migrator: '0x79911ed1b61F5Fcd7251F0E4d05761E4B45B0D82', // V3Migrator
        tickLens: '0x0EAe3D022aAA5b7596CC264f4D3732804ce7CEB0', // TickLens
        positionDescriptor: '0xAC1fA65FaB3fCE15Fc06Efd126eA1e8a6ED7F345', // NonfungibleTokenPositionDescriptor
        lmPoolDeployer: '0x0e025Ec0A045f140B9888E96a8A2A234FfA70B5f', // V3LmPoolDeployer
      },
    },
    features: {
      v2: true,
      v3: true,
      aggregator: true,
    },
    gasSettings: {
      gasPrice: '0.1', // 0.1 gwei - very cheap on Base
      gasLimit: 300000,
      maxFeePerGas: '0.2',
      maxPriorityFeePerGas: '0.01',
    },
  },

  // PulseChain (Chain ID: 369)
  369: {
    chainId: 369,
    name: 'PulseChain',
    nativeCurrency: 'PLS',
    rpcUrl: process.env.PULSECHAIN_RPC_URL || 'https://rpc.pulsechain.com',
    blockExplorer: 'https://scan.pulsechain.com',
    contracts: {
      v2: {
        factory: '0x3a0Fa7884dD93f3cd234bBE2A0958Ef04b05E13b', // 9MM V2 Factory
        router: '0xcC73b59F8D7b7c532703bDfea2808a28a488cF47', // 9MM V2 Router
      },
      v3: {
        factory: '0xe50DbDC88E87a2C92984d794bcF3D1d76f619C68', // V3Factory
        router: '0xa9444246d80d6E3496C9242395213B4f22226a59', // SmartRouter
        multicall: '0xC8edb20cA86A0c6B3dbd38A1D47579C625a23dF4', // InterfaceMulticall
        quoter: '0x500260dD7C27eCE20b89ea0808d05a13CF867279', // QuoterV2
        positionManager: '0xCC05bf158202b4F461Ede8843d76dcd7Bbad07f2', // NonfungiblePositionManager
        masterChef: '0x842f3eD1C390637C99F82833D01D37695BF22066', // MasterChefV3
        smartRouterHelper: '0xb7ef0a4d0EC7DEE58a7762EfB707ed0a646E92A9', // SmartRouterHelper
        mixedRouteQuoter: '0xBa53762F281A293B6bE73C9D2d3b740C433635cA', // MixedRouteQuoterV1
        tokenValidator: '0x623942Bb33b72f02061324A74C4718bC4b9366a1', // TokenValidator
        poolDeployer: '0x00f37661fA1b2B8A530cfb7B6d5A5a6AEd74177b', // V3PoolDeployer
        swapRouter: '0x7bE8fbe502191bBBCb38b02f2d4fA0D628301bEA', // SwapRouter
        migrator: '0xdee0BDC4cc82872f7D35941aBFA872F744FdF064', // V3Migrator
        tickLens: '0x9f6d34fCC7cB8f98dfC0A5CB414f6539B414d26a', // TickLens
        positionDescriptor: '0xfc6D8b33211c1ACe98d34b3b4b0DF35F4E3186d1', // NonfungibleTokenPositionDescriptor
        lmPoolDeployer: '0xa887a9F1A0Ebc94bBB1C868bD32189d078d5eeCf', // V3LmPoolDeployer
      },
    },
    features: {
      v2: true,
      v3: true,
      aggregator: true,
    },
    gasSettings: {
      gasPrice: '0.001', // Extremely cheap on PulseChain
      gasLimit: 500000,
    },
  },

  // Sonic (Chain ID: 146)
  146: {
    chainId: 146,
    name: 'Sonic',
    nativeCurrency: 'S',
    rpcUrl: process.env.SONIC_RPC_URL || 'https://rpc.soniclabs.com',
    blockExplorer: 'https://scan.soniclabs.com',
    contracts: {
      v2: {
        factory: '0x0f7B3FcBa276A65dd6E41E400055dcb75BA66750', // 9MM V2 Factory
        router: '0x46636339CC36978B3ac480FBaEd6389589A95eB1', // 9MM V2 Router
      },
      v3: {
        factory: '0x924aee3929C8A45aC9c41e9e9Cdf3eA761ca75e5', // V3Factory
        router: '0x32de6892a8269b40E726e32e580b96B2fEa44D81', // SmartRouter
        multicall: '0x3416bC49E9513ce8A0C4a07f7dBB3187f584bB4F', // InterfaceMulticall
        quoter: '0x5A810a28C1f41aF91f4537A86f11d602E4eA9dF1', // QuoterV2
        positionManager: '0x61fF993976682601A819A231837Dd865382d8e9C', // NonfungiblePositionManager
        masterChef: '0x14c35a0A3D2cA5Ad3D0DBa77668FDC3F7b2F1863', // MasterChefV3
        smartRouterHelper: '0x736DC9C20Dc6cc337B74B333b0e756A4464B13d6', // SmartRouterHelper
        mixedRouteQuoter: '0xEcA74A9c228C119cAcC4BFe615D21D79e91D9935', // MixedRouteQuoterV1
        tokenValidator: '0xb01F2E91455b5e62Ea11370eA59821679b8dB822', // TokenValidator
        poolDeployer: '0x5Be36DeD90233B05848B64b072C626e54A5B470E', // V3PoolDeployer
        swapRouter: '0x807Bb427183B9464C7eE291cdb2Bbb47f400F953', // SwapRouter
        migrator: '0x4FEd4AACA7C5FFAF82D9B6609495872abEd29666', // V3Migrator
        tickLens: '0x56Ccfe4D3A9e6dF16c7Cb713Cd1385b90F5ED65a', // TickLens
        positionDescriptor: '0x4765474f6a9c3497eDcd83F10E26f0e2DA01a77b', // NonfungibleTokenPositionDescriptor
        lmPoolDeployer: '0x44617362cf4E546DE2B0831B444a841DBC9B4050', // V3LmPoolDeployer
      },
    },
    features: {
      v2: true,
      v3: true,
      aggregator: true,
    },
    gasSettings: {
      gasPrice: '0.01', // Fast and cheap
      gasLimit: 400000,
    },
  },
};

export const SUPPORTED_9MM_CHAINS = [8453, 369, 146];

export const get9MMConfig = (chainId: number): I9MMChainConfig => {
  const config = CHAIN_9MM_CONFIGS[chainId];
  if (!config) {
    throw new Error(`9MM not deployed on chain ${chainId}`);
  }
  return config;
};

export const getAllSupported9MMChains = (): I9MMChainConfig[] => {
  return SUPPORTED_9MM_CHAINS.map(chainId => CHAIN_9MM_CONFIGS[chainId]);
};

// Token addresses for common tokens on each chain
export const COMMON_TOKENS = {
  8453: { // Base
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    '9MM': '0xe290b5095d98a7a4f0ec7ec4b2c93d83eb34dd01f9fE', // From deployment
  },
  369: { // PulseChain
    WPLS: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27',
    PLSX: '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab',
    '9MM': '0x7b39c70e3e2cf1ba11b2b12ee9d96bc7d2deA719', // From deployment
  },
  146: { // Sonic
    WS: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
    USDC: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
    '9MM': '0xC5cBFce0B3e9Aee8Ad5E31Ce83c46a2f4D5CF37C', // From deployment
  },
};

// Fee structures for 9MM
export const NINE_MM_FEES = {
  v2: 0.0017, // 0.17% (lower than standard 0.3%)
  v3: {
    low: 0.0005,    // 0.05%
    medium: 0.003,  // 0.3%
    high: 0.01,     // 1%
  },
  aggregator: 0.001, // 0.1%
}; 