import { prompt } from "inquirer";
import path from "path";
import { getWalletOrSigner } from "../wallet";
import { getSupportedNetwork } from "../../../common/networks";

jest.mock("inquirer");
jest.mock("../../../common/networks");
jest.mock("ethers", () => ({
  ...jest.requireActual("ethers"),
  providers: {
    ...jest.requireActual("ethers").providers,
    JsonRpcProvider: jest.fn(),
  },
}));

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const promptMock: jest.Mock = prompt;
const getSupportedNetworkMock = getSupportedNetwork as jest.MockedFunction<typeof getSupportedNetwork>;

// Note: This is a dummy password used only for testing mock wallet encryption/decryption.
const mockedPassword = "password123";
const mockedInvalidPassword = "invalid";

// Note: Dummy test wallets — private keys for local development and CI/CD only.
// These wallets are not for production and hold no funds or value on any network.
const privateKey = "0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2";
const walletAddress = "0xB26B4941941C51a4885E5B7D3A1B861E54405f90";

// Factory function to create mock providers with complete ethers.js provider interface
const createMockProvider = (chainId: number, name: string): any => ({
  getNetwork: jest.fn().mockResolvedValue({ chainId, name }),
  getBalance: jest.fn(),
  getTransactionCount: jest.fn(),
  getGasPrice: jest.fn(),
  estimateGas: jest.fn(),
  call: jest.fn(),
  sendTransaction: jest.fn(),
  getBlock: jest.fn(),
  getTransaction: jest.fn(),
  getTransactionReceipt: jest.fn(),
  getLogs: jest.fn(),
  resolveName: jest.fn(),
  lookupAddress: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
  listenerCount: jest.fn(),
  listeners: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  waitForTransaction: jest.fn(),
  _isProvider: true,
});

// Mock provider for default network tests
const mockNetworkProvider = createMockProvider(11155111, "sepolia");

describe("wallet", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);

  beforeEach(() => {
    // Mock the default network provider
    getSupportedNetworkMock.mockReturnValue({
      provider: () => mockNetworkProvider as any,
      networkId: 11155111,
      networkName: "sepolia" as any,
      explorer: "https://sepolia.etherscan.io",
      currency: "ETH" as any,
    });
  });

  afterEach(() => {
    delete process.env.OA_PRIVATE_KEY;
    promptMock.mockRestore();
    jest.clearAllMocks();
  });
  it("should return the wallet when providing the key using environment variable", async () => {
    process.env.OA_PRIVATE_KEY = privateKey;
    const wallet = await getWalletOrSigner({ network: "sepolia" });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing the key using key option", async () => {
    const wallet = await getWalletOrSigner({ network: "sepolia", key: privateKey });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing the key using key-file option", async () => {
    const wallet = await getWalletOrSigner({ network: "sepolia", keyFile: path.resolve(__dirname, "./key.file") });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing an encrypted wallet", async () => {
    promptMock.mockReturnValue({ password: mockedPassword });

    const wallet = await getWalletOrSigner({
      network: "sepolia",
      encryptedWalletPath: path.resolve(__dirname, "./wallet.json"),
      progress: () => void 0, // shut up progress bar
    });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should throw an error when the wallet password is invalid", async () => {
    promptMock.mockReturnValue({ password: mockedInvalidPassword });

    await expect(
      getWalletOrSigner({
        network: "sepolia",
        encryptedWalletPath: path.resolve(__dirname, "./wallet.json"),
        progress: () => void 0, // shut up progress bar
      })
    ).rejects.toStrictEqual(new Error("invalid password"));
  });
  it("should throw an error when no option is provided", async () => {
    await expect(getWalletOrSigner({ network: "sepolia" })).rejects.toStrictEqual(
      new Error(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      )
    );
  });

  describe("custom RPC URL", () => {
    const customRpcUrl = "https://custom-rpc.example.com";
    const mockCustomProvider = createMockProvider(1, "custom");

    let JsonRpcProviderSpy: jest.SpyInstance;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ethers } = require("ethers");
      JsonRpcProviderSpy = jest.spyOn(ethers.providers, "JsonRpcProvider").mockImplementation(() => mockCustomProvider);
    });

    afterEach(() => {
      JsonRpcProviderSpy.mockRestore();
    });

    it("should use custom RPC URL when provided with private key", async () => {
      const wallet = await getWalletOrSigner({
        network: "sepolia",
        key: privateKey,
        rpcUrl: customRpcUrl,
      });

      expect(JsonRpcProviderSpy).toHaveBeenCalledWith(customRpcUrl);
      await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
      expect(wallet.privateKey).toStrictEqual(privateKey);
    });

    it("should use custom RPC URL when provided with environment variable key", async () => {
      process.env.OA_PRIVATE_KEY = privateKey;

      const wallet = await getWalletOrSigner({
        network: "sepolia",
        rpcUrl: customRpcUrl,
      });

      expect(JsonRpcProviderSpy).toHaveBeenCalledWith(customRpcUrl);
      await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
      expect(wallet.privateKey).toStrictEqual(privateKey);
    });

    it("should use custom RPC URL when provided with key file", async () => {
      const wallet = await getWalletOrSigner({
        network: "sepolia",
        keyFile: path.resolve(__dirname, "./key.file"),
        rpcUrl: customRpcUrl,
      });

      expect(JsonRpcProviderSpy).toHaveBeenCalledWith(customRpcUrl);
      await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
      expect(wallet.privateKey).toStrictEqual(privateKey);
    });

    it("should use custom RPC URL when provided with encrypted wallet", async () => {
      promptMock.mockReturnValue({ password: mockedPassword });

      const wallet = await getWalletOrSigner({
        network: "sepolia",
        encryptedWalletPath: path.resolve(__dirname, "./wallet.json"),
        rpcUrl: customRpcUrl,
        progress: () => void 0,
      });

      expect(JsonRpcProviderSpy).toHaveBeenCalledWith(customRpcUrl);
      await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
      expect(wallet.privateKey).toStrictEqual(privateKey);
    });

    it("should prioritize custom RPC URL over network setting", async () => {
      const wallet = await getWalletOrSigner({
        network: "mainnet", // Different network
        key: privateKey,
        rpcUrl: customRpcUrl,
      });

      // Should use custom RPC URL instead of mainnet provider
      expect(JsonRpcProviderSpy).toHaveBeenCalledWith(customRpcUrl);
      await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
      expect(wallet.privateKey).toStrictEqual(privateKey);
    });
  });
});
