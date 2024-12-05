/* eslint-disable jest/no-disabled-tests */
import { isAddress } from "ethers/lib/utils";
import { getDefaultContractAddress } from "./helpers";

describe.skip("valid Token Registry Factory Address", () => {
  it("should return deployer address", () => {
    const { TitleEscrowFactory, TokenImplementation, Deployer } = getDefaultContractAddress(1338);

    expect(TitleEscrowFactory).toBeDefined();
    expect(TokenImplementation).toBeDefined();
    expect(Deployer).toBeDefined();

    expect(isAddress(TitleEscrowFactory || "")).toBe(true);
    expect(isAddress(TokenImplementation || "")).toBe(true);
    expect(isAddress(Deployer || "")).toBe(true);
  });
});
