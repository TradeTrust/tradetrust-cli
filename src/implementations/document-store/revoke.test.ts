import { revokeToDocumentStore } from "./revoke";

import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import { DocumentStoreRevokeCommand } from "../../commands/document-store/document-store-command.type";
import { addAddressPrefix } from "../../utils";
import { join } from "path";

jest.mock("@tradetrust-tt/document-store");

const deployParams: DocumentStoreRevokeCommand = {
  hash: "0xabcd",
  address: "0x1234",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

const deployParamsHederaTestnet: DocumentStoreRevokeCommand = {
  hash: "0xabcd",
  address: "0x1234",
  network: "sepolia",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};
// TODO the following test is very fragile and might break on every interface change of DocumentStoreFactory
// ideally must setup ganache, and run the function over it
describe("document-store", () => {
  // increase timeout because ethers is throttling
  jest.setTimeout(30000);
  describe("revokeDocumentStore", () => {
    const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = DocumentStoreFactory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnect: jest.Mock = mockedDocumentStoreFactory.connect;
    const mockedRevoke = jest.fn();
    const mockCallStaticRevoke = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedDocumentStoreFactory.mockReset();
      mockedConnect.mockReset();
      mockCallStaticRevoke.mockClear();
      mockedConnect.mockReturnValue({
        revoke: mockedRevoke,
        callStatic: {
          revoke: mockCallStaticRevoke,
        },
      });
      mockedRevoke.mockReturnValue({
        hash: "hash",
        wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
      });
    });
    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await revokeToDocumentStore(deployParams);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockCallStaticRevoke).toHaveBeenCalledTimes(1);
      expect(mockedRevoke.mock.calls[0][0]).toEqual(deployParams.hash);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept hash without 0x prefix and return deployed instance", async () => {
      const instance = await revokeToDocumentStore({ ...deployParams, hash: addAddressPrefix("abcd") });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
      expect(mockCallStaticRevoke).toHaveBeenCalledTimes(1);
      expect(mockedRevoke.mock.calls[0][0]).toEqual(deployParams.hash);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      await revokeToDocumentStore({
        hash: "0xabcd",
        address: "0x1234",
        network: "sepolia",
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await revokeToDocumentStore({
        hash: "0xabcd",
        address: "0x1234",
        network: "sepolia",
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should allow errors to bubble up", async () => {
      mockedConnect.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(revokeToDocumentStore(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(
        revokeToDocumentStore({
          hash: "0xabcd",
          address: "0x1234",
          network: "sepolia",
          dryRun: false,
          maxPriorityFeePerGasScale: 1,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });

    //Hedera Testnet
    it("should pass in the correct params and return the deployed instance for hederatestnet", async () => {
      const instance = await revokeToDocumentStore(deployParamsHederaTestnet);

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParamsHederaTestnet.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.address);
      expect(mockCallStaticRevoke).toHaveBeenCalledTimes(1);
      expect(mockedRevoke.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.hash);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should accept hash without 0x prefix and return deployed instance for hederatestnet", async () => {
      const instance = await revokeToDocumentStore({ ...deployParamsHederaTestnet, hash: addAddressPrefix("abcd") });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${deployParamsHederaTestnet.key}`);
      expect(mockedConnect.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.address);
      expect(mockCallStaticRevoke).toHaveBeenCalledTimes(1);
      expect(mockedRevoke.mock.calls[0][0]).toEqual(deployParamsHederaTestnet.hash);
      expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
    });

    it("should take in the key from environment variable for hederatestnet", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      await revokeToDocumentStore({
        hash: "0xabcd",
        address: "0x1234",
        network: "hederatestnet",
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file for hederatestnet", async () => {
      await revokeToDocumentStore({
        hash: "0xabcd",
        address: "0x1234",
        network: "hederatestnet",
        keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      });

      const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should allow errors to bubble up for hederatestnet", async () => {
      mockedConnect.mockImplementation(() => {
        throw new Error("An Error");
      });
      await expect(revokeToDocumentStore(deployParamsHederaTestnet)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere for hederatestnet", async () => {
      await expect(
          revokeToDocumentStore({
            hash: "0xabcd",
            address: "0x1234",
            network: "hederatestnet",
            dryRun: false,
            maxPriorityFeePerGasScale: 1,
          })
      ).rejects.toThrow(
          "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });
  });
});
