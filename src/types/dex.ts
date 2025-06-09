/**
 * DEX Types and Interfaces
 * Comprehensive types for multi-DEX, multi-chain operations
 */

export interface IEVMChain {
  chainId: number;
  name: string;
  nativeCurrency: string;
  rpcUrl: string;
  blockExplorer: string;
  isTestnet?: boolean;
}

export interface IToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  tags?: string[];
}

export interface ITokenPair {
  token0: IToken;
  token1: IToken;
  chainId: number;
}

export enum DEXProtocol {
  UNISWAP_V2 = 'uniswap_v2',
  UNISWAP_V3 = 'uniswap_v3',
  SUSHISWAP = 'sushiswap',
  PANCAKESWAP = 'pancakeswap',
  CURVE = 'curve',
  BALANCER = 'balancer',
  ONEINCH = '1inch',
  PARASWAP = 'paraswap',
  DODO = 'dodo',
  KYBER = 'kyber',
  NINE_MM = '9mm',
}

export interface IDEXInfo {
  protocol: DEXProtocol;
  name: string;
  version?: string;
  supportedChains: number[];
  apiEndpoint?: string;
  graphqlEndpoint?: string;
  factoryAddress?: string;
  routerAddress?: string;
  quoterAddress?: string;
  isActive: boolean;
}

export interface ISwapQuote {
  dexProtocol: DEXProtocol;
  fromToken: IToken;
  toToken: IToken;
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  priceImpact: number;
  slippage: number;
  gasEstimate: string;
  gasPrice: string;
  route: ISwapRoute[];
  validUntil: number;
  chainId: number;
}

export interface ISwapRoute {
  protocol: DEXProtocol;
  tokenIn: IToken;
  tokenOut: IToken;
  amountIn: string;
  amountOut: string;
  poolAddress?: string;
  fee?: number;
  exchange?: string;
}

export interface ILiquidityPool {
  address: string;
  dexProtocol: DEXProtocol;
  token0: IToken;
  token1: IToken;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
  fee: number;
  volume24h: string;
  volumeWeek: string;
  liquidityUSD: string;
  apr: number;
  chainId: number;
}

export interface IPriceData {
  token: IToken;
  priceUSD: string;
  priceChange24h: number;
  volume24h: string;
  marketCap: string;
  timestamp: number;
  source: string;
  chainId: number;
}

export interface ISwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
  deadline: number;
  chainId: number;
  dexProtocol: DEXProtocol;
  userAddress: string;
  gasPrice?: string;
}

export interface ISwapResult {
  success: boolean;
  transactionHash?: string;
  gasUsed?: string;
  actualAmountOut?: string;
  error?: string;
  executionTime: number;
  chainId: number;
  dexProtocol: DEXProtocol;
}

export interface IDEXAggregatorQuote {
  bestQuote: ISwapQuote;
  allQuotes: ISwapQuote[];
  savings: {
    amount: string;
    percentage: number;
  };
  recommendedDEX: DEXProtocol;
}

export interface IGraphQLPriceQuery {
  query: string;
  variables: Record<string, any>;
  endpoint: string;
}

export interface IAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    executionTime: number;
    timestamp: string;
    source: string;
    chainId?: number;
  };
} 