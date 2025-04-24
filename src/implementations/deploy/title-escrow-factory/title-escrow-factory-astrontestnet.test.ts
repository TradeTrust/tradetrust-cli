import { join } from "path";
import { Wallet } from "ethers";
import { DeployTitleEscrowFactoryCommand } from "../../../commands/deploy/deploy.types";
import { TitleEscrowFactory__factory } from "@tradetrust-tt/token-registry/contracts";
import { deployTitleEscrowFactory } from "./title-escrow-factory";

jest.mock("@tradetrust-tt/token-registry/contracts");

const deployParams: DeployTitleEscrowFactoryCommand = {
  network: "astrontestnet",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  dryRun: false,
  maxPriorityFeePerGasScale: 1.0,
};

describe("title escrow factory", () => {
  describe("deployTitleEscrowFactory", () => {
    const mockedTitleEscrowFactory: jest.Mock<TitleEscrowFactory__factory> = TitleEscrowFactory__factory as any;
    const mockedDeploy: jest.Mock = mockedTitleEscrowFactory.prototype.deploy;
    // increase timeout because ethers is throttling
    jest.setTimeout(30_000);
    jest.spyOn(global, "fetch").mockImplementation(
      jest.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              standard: {
                maxPriorityFee: 0,
                maxFee: 0,
              },
            }),
        })
      ) as jest.Mock
    );

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTitleEscrowFactory.mockReset();
      mockedDeploy.mockReset();
      mockedDeploy.mockResolvedValue({
        deployTransaction: { hash: "hash", blockNumber: 1 },
        deployed: () => Promise.resolve(),
        address: "contractAddress",
      });
    });

    it("should take in the key from environment variable", async () => {
      process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

      await deployTitleEscrowFactory({
        network: "astrontestnet",
        dryRun: false,
        maxPriorityFeePerGasScale: 1.0,
      });

      const passedSigner: Wallet = mockedTitleEscrowFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
    });

    it("should take in the key from key file", async () => {
      await deployTitleEscrowFactory({
        network: "astrontestnet",
        keyFile: join(__dirname, "..", "..", "..", "..", "examples", "sample-key"),
        dryRun: false,
        maxPriorityFeePerGasScale: 1.0,
      });

      const passedSigner: Wallet = mockedTitleEscrowFactory.mock.calls[0][0];
      expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
    });

    it("should pass in the correct params and return the deployed instance", async () => {
      const instance = await deployTitleEscrowFactory(deployParams);

      const passedSigner: Wallet = mockedTitleEscrowFactory.mock.calls[0][0];

      expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
      // price should be any length string of digits
      expect(instance.contractAddress).toBe("contractAddress");
    });

    it("should allow errors to bubble up", async () => {
      mockedDeploy.mockRejectedValue(new Error("An Error"));
      await expect(deployTitleEscrowFactory(deployParams)).rejects.toThrow("An Error");
    });

    it("should throw when keys are not found anywhere", async () => {
      await expect(
        deployTitleEscrowFactory({
          network: "astrontestnet",
          dryRun: false,
          maxPriorityFeePerGasScale: 1.0,
        })
      ).rejects.toThrow(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      );
    });
  });
});
