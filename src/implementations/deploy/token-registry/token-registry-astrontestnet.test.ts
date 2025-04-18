/* eslint-disable jest/no-disabled-tests */
import { Contract } from "ethers";
import { DeployTokenRegistryCommand } from "../../../commands/deploy/deploy.types";
import { encodeInitParams } from "./helpers";
import { deployTokenRegistry } from "./token-registry";

const deployParams: DeployTokenRegistryCommand = {
  registryName: "Test",
  registrySymbol: "Tst",
  network: "astrontestnet",
  key: "0000000000000000000000000000000000000000000000000000000000000001",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
  standalone: false,
};

describe.skip("deploy Token Registry", () => {
  const mockedEthersContract: jest.Mock<Contract> = Contract as any;
  // eslint-disable-next-line jest/prefer-spy-on
  mockedEthersContract.prototype.deploy = jest.fn();
  const mockedDeploy: jest.Mock = mockedEthersContract.prototype.deploy;

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
    mockedDeploy.mockReset();
    mockedDeploy.mockResolvedValue({
      hash: "hash",
      blockNumber: "blockNumber",
      wait: () =>
        Promise.resolve({
          events: [
            {
              topics: [
                "0x3588ebb5c75fdf91927f8472318f41513ee567c2612a5ce52ac840dcf6f162f5", // deployment
                "0x000000000000000000000000e7163d4666e15ec691f0ba0ec300fe1dd71ae2de",
                "0x000000000000000000000000b30ba3b8ba59ed74a9d55ded647b4516823ac750",
                "0x00000000000000000000000088f17c6964c859cf0bb9ee53d91685b2529e0976",
              ],
              data: "0x0000000000000000000000000f1fc16ef456d0fdc7c53d1d94f4a2e97c7064e3000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000088f17c6964c859cf0bb9ee53d91685b2529e09760000000000000000000000000000000000000000000000000000000000000001410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014100000000000000000000000000000000000000000000000000000000000000",
              args: [
                "0xe7163d4666e15ec691f0ba0ec300fe1dd71ae2de",
                "0xA0Da221B3cd3e863425E1F1D34B9307D295a9d03",
                "0x88f17c6964c859cf0bb9ee53d91685b2529e0976",
                "0x0f1fc16ef456d0fdc7c53d1d94f4a2e97c7064e3",
                "0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000088f17c6964c859cf0bb9ee53d91685b2529e09760000000000000000000000000000000000000000000000000000000000000001410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014100000000000000000000000000000000000000000000000000000000000000",
              ] as unknown,
            },
          ],
        }),
    });
  });

  it("should pass in the correct params and return the deployed instance", async () => {
    await deployTokenRegistry(deployParams);

    const expectedInitParams = encodeInitParams({
      name: deployParams.registryName,
      symbol: deployParams.registrySymbol,
      deployer: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
    });

    expect(mockedDeploy.mock.calls[0][0]).toBe("0xA0Da221B3cd3e863425E1F1D34B9307D295a9d03");
    expect(mockedDeploy.mock.calls[0][1]).toEqual(expectedInitParams);

    // price should be any length string of digits
    // expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
    // expect(instance.contractAddress).toBe("contractAddress"); // TODO
  });

  it("should pass in the correct params with standalone and return the deployed instance", async () => {
    const deployStandalone = {
      standalone: true,
      ...deployParams,
    };
    await deployTokenRegistry(deployStandalone);

    const expectedInitParams = encodeInitParams({
      name: deployParams.registryName,
      symbol: deployParams.registrySymbol,
      deployer: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
    });

    expect(mockedDeploy.mock.calls[0][0]).toBe("0xA0Da221B3cd3e863425E1F1D34B9307D295a9d03");
    expect(mockedDeploy.mock.calls[0][1]).toEqual(expectedInitParams);

    // price should be any length string of digits
    // expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
    // expect(instance.contractAddress).toBe("contractAddress"); // TODO
  });

  it("should pass in the correct params with unspecified standalone and return the deployed instance", async () => {
    const deployParamsUnspecified = deployParams;
    delete deployParamsUnspecified.standalone;
    await deployTokenRegistry(deployParamsUnspecified);

    const expectedInitParams = encodeInitParams({
      name: deployParams.registryName,
      symbol: deployParams.registrySymbol,
      deployer: "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
    });

    expect(mockedDeploy.mock.calls[0][0]).toBe("0xA0Da221B3cd3e863425E1F1D34B9307D295a9d03");
    expect(mockedDeploy.mock.calls[0][1]).toEqual(expectedInitParams);

    // price should be any length string of digits
    // expect(mockedDeploy.mock.calls[0][2].gasPrice.toString()).toStrictEqual(expect.stringMatching(/\d+/));
    // expect(instance.contractAddress).toBe("contractAddress"); // TODO
  });

  it("should allow errors to bubble up", async () => {
    mockedDeploy.mockRejectedValue(new Error("An Error"));
    await expect(deployTokenRegistry(deployParams)).rejects.toThrow("An Error");
  });

  it("should throw when keys are not found anywhere", async () => {
    delete process.env.OA_PRIVATE_KEY;
    await expect(
      deployTokenRegistry({
        registryName: "Test",
        registrySymbol: "Tst",
        network: "astrontestnet",
        dryRun: false,
        maxPriorityFeePerGasScale: 1.0,
      })
    ).rejects.toThrow(
      "No private key found in OA_PRIVATE_KEY, key, key-file, please supply at least one or supply an encrypted wallet path, or provide aws kms signer information"
    );
  });
});
