import { Wallet } from "ethers";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { addAddressPrefix } from "../../utils";
import { issueToTokenRegistry } from "./issue";
import { mint } from "@trustvc/trustvc";

jest.mock("@trustvc/trustvc", () => ({
  mint: jest.fn(),
}));

const deployParams: TokenRegistryIssueCommand = {
  beneficiary: "0xabcd",
  holder: "0xabce",
  tokenId: "0xzyxw",
  remark: "remark",
  encryptionKey: "0x1234",
  address: "0x1234",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

const mockTransaction = {
  transactionHash: "0x194bdcf15e",
  to: "0x1234",
  from: "0x5678",
  transactionIndex: 0,
  blockHash: "0xabcd",
  logs: [],
  events: [],
};

describe("token-registry", () => {
  describe("issue", () => {
    jest.setTimeout(30000);
    const mockedMint = mint as jest.MockedFunction<typeof mint>;

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedMint.mockClear();
      mockedMint.mockResolvedValue({
        hash: "0x194bdcf15e",
        blockNumber: 123,
        wait: () => Promise.resolve(mockTransaction as any),
      } as any);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      const instance = await issueToTokenRegistry({
        ...deployParams,
        key: privateKey,
      });

      expect(mockedMint).toHaveBeenCalledTimes(1);
      const [contractOptions, signer, params, options] = mockedMint.mock.calls[0];
      expect(contractOptions.tokenRegistryAddress).toEqual(deployParams.address);
      expect((signer as Wallet).privateKey).toBe(`0x${privateKey}`);

      expect(params.beneficiaryAddress).toEqual(deployParams.beneficiary);
      expect(params.holderAddress).toEqual(deployParams.holder);
      expect(params.tokenId).toEqual(deployParams.tokenId);
      expect(params.remarks).toEqual(deployParams.remark);

      expect(options.id).toEqual(deployParams.encryptionKey);
      expect(instance).toStrictEqual(mockTransaction);
    });

    it("should accept tokenId without 0x prefix and return deployed instance", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      const tokenIdWithPrefix = addAddressPrefix("zyxw");
      const instance = await issueToTokenRegistry({
        ...deployParams,
        key: privateKey,
        tokenId: tokenIdWithPrefix,
      });

      expect(mockedMint).toHaveBeenCalledTimes(1);
      const [contractOptions, signer, params, options] = mockedMint.mock.calls[0];
      expect(contractOptions.tokenRegistryAddress).toEqual(deployParams.address);
      expect((signer as Wallet).privateKey).toBe(`0x${privateKey}`);

      expect(params.beneficiaryAddress).toEqual(deployParams.beneficiary);
      expect(params.holderAddress).toEqual(deployParams.holder);
      expect(params.tokenId).toEqual(tokenIdWithPrefix);
      expect(params.remarks).toEqual(deployParams.remark);

      expect(options.id).toEqual(deployParams.encryptionKey);
      expect(instance).toStrictEqual(mockTransaction);
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(issueToTokenRegistry(deployParams)).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });

    it("should allow errors to bubble up", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";
      mockedMint.mockRejectedValue(new Error("An Error"));
      await expect(issueToTokenRegistry(deployParams)).rejects.toThrow("An Error");
    });
  });
});
