import { providers } from "ethers";
import type { GasStationFunction } from "./gas-station";
import { gasStation } from "./gas-station";

export type networkCurrency = "ETH" | "MATIC" | "XDC" | "FREE" | "ASTRON";

type SupportedNetwork = {
  explorer: string;
  provider: () => providers.Provider;
  networkId: number;
  networkName: (typeof NetworkCmdName)[keyof typeof NetworkCmdName];
  currency: networkCurrency;
  gasStation?: ReturnType<GasStationFunction>;
};

export enum NetworkCmdName {
  Local = "local",
  Mainnet = "mainnet",
  Sepolia = "sepolia",
  Matic = "matic",
  Amoy = "amoy",
  XDC = "xdc",
  XDCApothem = "xdcapothem",
  StabilityTestnet = "stabilitytestnet",
  Stability = "stability",
  Astron = "astron",
  AstronTestnet = "astrontestnet",
}

const defaultInfuraProvider =
  (networkName: string): (() => providers.Provider) =>
  () =>
    new providers.InfuraProvider(networkName);

const jsonRpcProvider =
  (url: string): (() => providers.Provider) =>
  () =>
    new providers.JsonRpcProvider(url);

export const supportedNetwork: {
  [key in NetworkCmdName]: SupportedNetwork;
} = {
  [NetworkCmdName.Local]: {
    explorer: "https://localhost/explorer",
    provider: jsonRpcProvider("http://127.0.0.1:8545"),
    networkId: 1337,
    networkName: NetworkCmdName.Local,
    currency: "ETH",
  },
  [NetworkCmdName.Mainnet]: {
    explorer: "https://etherscan.io",
    provider: defaultInfuraProvider("homestead"),
    networkId: 1,
    networkName: NetworkCmdName.Mainnet,
    currency: "ETH",
  },
  [NetworkCmdName.Sepolia]: {
    explorer: "https://sepolia.etherscan.io",
    provider: jsonRpcProvider("https://sepolia.infura.io/v3/bb46da3f80e040e8ab73c0a9ff365d18"),
    networkId: 11155111,
    networkName: NetworkCmdName.Sepolia,
    currency: "ETH",
  },
  [NetworkCmdName.Matic]: {
    explorer: "https://polygonscan.com",
    provider: defaultInfuraProvider("matic"),
    networkId: 137,
    networkName: NetworkCmdName.Matic,
    currency: "MATIC",
    gasStation: gasStation("https://gasstation.polygon.technology/v2"),
  },
  [NetworkCmdName.Amoy]: {
    explorer: "https://www.oklink.com/amoy",
    provider: jsonRpcProvider("https://polygon-amoy.infura.io/v3/48bea089ceb34f579d2381195ca46c1d"),
    networkId: 80002,
    networkName: NetworkCmdName.Amoy,
    currency: "MATIC",
    gasStation: gasStation("https://gasstation-testnet.polygon.technology/amoy"),
  },
  [NetworkCmdName.XDC]: {
    explorer: "https://xdcscan.io",
    provider: jsonRpcProvider("https://rpc.ankr.com/xdc"),
    networkId: 50,
    networkName: NetworkCmdName.XDC,
    currency: "XDC",
  },
  [NetworkCmdName.XDCApothem]: {
    explorer: "https://apothem.xdcscan.io",
    provider: jsonRpcProvider("https://rpc.ankr.com/xdc_testnet"),
    networkId: 51,
    networkName: NetworkCmdName.XDCApothem,
    currency: "XDC",
  },
  [NetworkCmdName.Stability]: {
    explorer: "https://stability.blockscout.com",
    provider: jsonRpcProvider(`https://rpc.stabilityprotocol.com/zgt/tradeTrust`),
    networkId: 101010,
    networkName: NetworkCmdName.Stability,
    currency: "FREE",
    gasStation: gasStation("https://rpc.stabilityprotocol.com/gas-station"),
  },
  [NetworkCmdName.StabilityTestnet]: {
    explorer: "https://stability-testnet.blockscout.com/",
    provider: jsonRpcProvider("https://rpc.testnet.stabilityprotocol.com/zgt/tradeTrust"),
    networkId: 20180427,
    networkName: NetworkCmdName.StabilityTestnet,
    currency: "FREE",
    gasStation: gasStation("https://rpc.testnet.stabilityprotocol.com/gas-station"),
  },
  [NetworkCmdName.Astron]: {
    explorer: "https://astronscanl2.bitfactory.cn/",
    provider: jsonRpcProvider("https://astronlayer2.bitfactory.cn/query/"),
    networkId: 1338,
    networkName: NetworkCmdName.Astron,
    currency: "ASTRON",
    gasStation: gasStation("https://astronscanl2.bitfactory.cn/gas-station"),
  },
  [NetworkCmdName.AstronTestnet]: {
    explorer: "https://dev-astronscanl2.bitfactory.cn/",
    provider: jsonRpcProvider("https://dev-astronlayer2.bitfactory.cn/query/"),
    networkId: 21002,
    networkName: NetworkCmdName.AstronTestnet,
    currency: "ASTRON",
    gasStation: gasStation("https://dev-astronscanl2.bitfactory.cn/gas-station"),
  },
};

export const getSupportedNetwork = (networkCmdName: string): SupportedNetwork => {
  return supportedNetwork[networkCmdName as NetworkCmdName];
};

export const getSupportedNetworkNameFromId = (networkId: number): SupportedNetwork["networkName"] => {
  const network = Object.values(supportedNetwork).find((network) => network.networkId === networkId);
  if (!network) {
    throw new Error(`Unsupported chain id ${networkId}`);
  }
  return network.networkName;
};
