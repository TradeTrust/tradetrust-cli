import { issueToDocumentStore } from "./issue";
import { Wallet } from "ethers";
import { DocumentStoreFactory } from "@tradetrust-tt/document-store";
import { DocumentStoreIssueCommand } from "../../commands/document-store/document-store-command.type";
import { addAddressPrefix } from "../../utils";
import { join } from "path";

jest.mock("@tradetrust-tt/document-store");

const deployParams: DocumentStoreIssueCommand = {
  hash: "0xabcd",
  address: "0x1234",
  network: "astron",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

// TODO the following test is very fragile and might break on every interface change of DocumentStoreFactory
// ideally must setup ganache, and run the function over it
describe("issue document-store", () => {
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

  const mockedDocumentStoreFactory: jest.Mock<DocumentStoreFactory> = DocumentStoreFactory as any;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore mock static method
  const mockedConnect: jest.Mock = mockedDocumentStoreFactory.connect;
  const mockedIssue = jest.fn();
  const mockCallStaticIssue = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    delete process.env.OA_PRIVATE_KEY;
    mockedDocumentStoreFactory.mockReset();
    mockedConnect.mockReset();
    mockCallStaticIssue.mockClear();
    mockedConnect.mockReturnValue({
      issue: mockedIssue,
      callStatic: {
        issue: mockCallStaticIssue,
      },
    });
    mockedIssue.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });
  });

  it("should take in the key from environment variable", async () => {
    process.env.OA_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000002";

    await issueToDocumentStore({
      hash: "0xabcd",
      address: "0x1234",
      network: "astron",
      maxPriorityFeePerGasScale: 1,
      dryRun: false,
    });

    const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
    expect(passedSigner.privateKey).toBe(`0x${process.env.OA_PRIVATE_KEY}`);
  });

  it("should pass in the correct params and return the deployed instance", async () => {
    const instance = await issueToDocumentStore(deployParams);

    const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

    expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
    expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
    expect(mockCallStaticIssue).toHaveBeenCalledTimes(1);
    expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.hash);
    expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
  });

  it("should take in the key from key file", async () => {
    await issueToDocumentStore({
      hash: "0xabcd",
      address: "0x1234",
      network: "astron",
      keyFile: join(__dirname, "..", "..", "..", "examples", "sample-key"),
      dryRun: false,
      maxPriorityFeePerGasScale: 1,
    });

    const passedSigner: Wallet = mockedConnect.mock.calls[0][1];
    expect(passedSigner.privateKey).toBe(`0x0000000000000000000000000000000000000000000000000000000000000003`);
  });

  it("should accept hash without 0x prefix and return deployed instance", async () => {
    const instance = await issueToDocumentStore({ ...deployParams, hash: addAddressPrefix("abcd") });

    const passedSigner: Wallet = mockedConnect.mock.calls[0][1];

    expect(passedSigner.privateKey).toBe(`0x${deployParams.key}`);
    expect(mockedConnect.mock.calls[0][0]).toEqual(deployParams.address);
    expect(mockCallStaticIssue).toHaveBeenCalledTimes(1);
    expect(mockedIssue.mock.calls[0][0]).toEqual(deployParams.hash);
    expect(instance).toStrictEqual({ transactionHash: "transactionHash" });
  });

  it("should allow errors to bubble up", async () => {
    mockedConnect.mockImplementation(() => {
      throw new Error("An Error");
    });
    await expect(issueToDocumentStore(deployParams)).rejects.toThrow("An Error");
  });

  it("should throw when keys are not found anywhere", async () => {
    await expect(
      issueToDocumentStore({
        hash: "0xabcd",
        address: "0x1234",
        network: "astron",
        dryRun: false,
        maxPriorityFeePerGasScale: 1,
      })
    ).rejects.toThrow(
      "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
    );
  });
});
