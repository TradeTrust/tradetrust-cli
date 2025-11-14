import { prompt } from "inquirer";
import path from "path";
import { getWalletOrSigner } from "../wallet";
jest.mock("inquirer");

// assigning the mock so that we get correct typing
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const promptMock: jest.Mock = prompt;

// Note: Dummy test wallets — private keys for local development and CI/CD only.
// These wallets are not for production and hold no funds or value on any network.
const privateKey = "0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2";
const walletAddress = "0xB26B4941941C51a4885E5B7D3A1B861E54405f90";

// Note: This is a dummy password used only for testing mock wallet encryption/decryption.
const mockedPassword = "password123";
const mockedInvalidPassword = "invalid";

describe("wallet", () => {
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
  afterEach(() => {
    delete process.env.OA_PRIVATE_KEY;
    promptMock.mockRestore();
  });
  it("should return the wallet when providing the key using environment variable", async () => {
    process.env.OA_PRIVATE_KEY = privateKey;
    const wallet = await getWalletOrSigner({ network: "astrontestnet" });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing the key using key option", async () => {
    const wallet = await getWalletOrSigner({ network: "astrontestnet", key: privateKey });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing the key using key-file option", async () => {
    const wallet = await getWalletOrSigner({
      network: "astrontestnet",
      keyFile: path.resolve(__dirname, "./key.file"),
    });
    await expect(wallet.getAddress()).resolves.toStrictEqual(walletAddress);
    expect(wallet.privateKey).toStrictEqual(privateKey);
  });
  it("should return the wallet when providing an encrypted wallet", async () => {
    promptMock.mockReturnValue({ password: mockedPassword });

    const wallet = await getWalletOrSigner({
      network: "astrontestnet",
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
        network: "astrontestnet",
        encryptedWalletPath: path.resolve(__dirname, "./wallet.json"),
        progress: () => void 0, // shut up progress bar
      })
    ).rejects.toStrictEqual(new Error("invalid password"));
  });
  it("should throw an error when no option is provided", async () => {
    await expect(getWalletOrSigner({ network: "astrontestnet" })).rejects.toStrictEqual(
      new Error(
        "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
      )
    );
  });
});
