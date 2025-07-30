import { deployDocumentStore } from "./document-store";
import { join } from "path";
import { Wallet, utils } from "ethers";
import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import { DeployDocumentStoreCommand } from "../../../commands/deploy/deploy.types";

jest.mock("@tradetrust-tt/document-store");

const deployParams: DeployDocumentStoreCommand = {
  storeName: "Test Document Store",
  owner: "0x1234",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("document-store", () => {
  describe("deployDocumentStore", () => {
    const documentStoreFactory: any = DocumentStoreFactory;
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = documentStoreFactory;
    const mockedDeploy: jest.Mock = mockedDocumentStoreFactory.prototype.deploy;
    // increase timeout because ethers is throttling
    jest.setTimeout(30000);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedDeploy.mockReset();
      mockedDeploy.mockResolvedValue({
        deployTransaction: { hash: "hash", wait: () => Promise.resolve({ contractAddress: "contractAddress" }) },
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await deployDocumentStore({
        storeName: "Test",
        network: "sepolia",
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await deployDocumentStore({
        storeName: "Test",
        network: "sepolia",
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await deployDocumentStore(deployParams);

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedDeploy.mock.calls[0][0]).toStrictEqual(deployParams.storeName);
      expect(mockedDeploy.mock.calls[0][1]).toStrictEqual(deployParams.owner);
      // price should be any length string of digits
      expect(mockedDeploy.mock.calls[0][2].maxPriorityFeePerGas.toString()).toStrictEqual(expect.stringMatching(/\d+/));
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployDocumentStore(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(
        deployDocumentStore({
          storeName: "Test",
          network: "sepolia",
          dryRun: false,
          maxPriorityFeePerGasScale: 1,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });

    it("should default the owner as the deployer", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await deployDocumentStore({
        maxPriorityFeePerGasScale: 1,
        storeName: "Test",
        network: "sepolia",
        dryRun: false,
      });

      const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
      const addr = await passedSigner.getAddress();
      expect(mockedDeploy.mock.calls[0][1]).toStrictEqual(addr);
    });

    describe("should use custom RPC URL", () => {
      const createMockProvider = (chainId: number, name: string): any => ({
        getNetwork: jest.fn().mockResolvedValue({ chainId, name }),
        getBalance: jest.fn(),
        getTransactionCount: jest.fn(),
        getGasPrice: jest.fn(),
        getFeeData: jest.fn().mockResolvedValue({
          maxFeePerGas: utils.parseUnits("20", "gwei"),
          maxPriorityFeePerGas: utils.parseUnits("2", "gwei"),
          gasPrice: utils.parseUnits("20", "gwei"),
        }),
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

      it("should use custom RPC URL when provided with private key", async () => {
        const customRpcUrl = "https://custom-rpc.example.com";
        const mockProvider = createMockProvider(11155111, "sepolia");

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ethers: ethersModule } = require("ethers");
        const jsonRpcProviderSpy = jest
          .spyOn(ethersModule.providers, "JsonRpcProvider")
          .mockImplementation(() => mockProvider);

        await deployDocumentStore({
          storeName: "Test",
          network: "sepolia",
          key: "0000000000000000000000000000000000000000000000000000000000000001",
          rpcUrl: customRpcUrl,
          dryRun: false,
          maxPriorityFeePerGasScale: 1,
        } as any);

        const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
        expect(passedSigner.privateKey).toBe("0x0000000000000000000000000000000000000000000000000000000000000001");
        // Verify JsonRpcProvider was called with the custom RPC URL
        expect(jsonRpcProviderSpy).toHaveBeenCalledWith(customRpcUrl);

        jsonRpcProviderSpy.mockRestore();
      });

      it("should use custom RPC URL when provided with environment variable key", async () => {
        process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
        const customRpcUrl = "https://another-custom-rpc.example.com";
        const mockProvider = createMockProvider(11155111, "sepolia");

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ethers: ethersModule } = require("ethers");
        const jsonRpcProviderSpy = jest
          .spyOn(ethersModule.providers, "JsonRpcProvider")
          .mockImplementation(() => mockProvider);

        await deployDocumentStore({
          storeName: "Test",
          network: "sepolia",
          rpcUrl: customRpcUrl,
          dryRun: false,
          maxPriorityFeePerGasScale: 1,
        } as any);

        const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
        expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
        // Verify JsonRpcProvider was called with the custom RPC URL
        expect(jsonRpcProviderSpy).toHaveBeenCalledWith(customRpcUrl);

        jsonRpcProviderSpy.mockRestore();
      });

      it("should use custom RPC URL when provided with key file", async () => {
        const customRpcUrl = "https://keyfile-custom-rpc.example.com";
        const mockProvider = createMockProvider(11155111, "sepolia");

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ethers: ethersModule } = require("ethers");
        const jsonRpcProviderSpy = jest
          .spyOn(ethersModule.providers, "JsonRpcProvider")
          .mockImplementation(() => mockProvider);

        await deployDocumentStore({
          storeName: "Test",
          network: "sepolia",
          keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
          rpcUrl: customRpcUrl,
          dryRun: false,
          maxPriorityFeePerGasScale: 1,
        } as any);

        const passedSigner: Wallet = mockedDocumentStoreFactory.mock.calls[0][0];
        expect(passedSigner.privateKey).toBe("0x0000000000000000000000000000000000000000000000000000000000000003");
        // Verify JsonRpcProvider was called with the custom RPC URL
        expect(jsonRpcProviderSpy).toHaveBeenCalledWith(customRpcUrl);

        jsonRpcProviderSpy.mockRestore();
      });
    });
  });
});
