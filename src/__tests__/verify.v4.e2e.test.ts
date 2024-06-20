import { handler } from "../commands/verify";
import path from "path";
import signale from "signale";

describe("verify", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  const signaleSuccessSpy = jest.spyOn(signale, "success");
  const signaleErrorSpy = jest.spyOn(signale, "error");
  it("should fail on did-idvc-wrapped-signed-idvc-revoked.json because identity is not verified", async () => {
    await handler({
      document: path.resolve("examples", "v4", "signed-documents", "did-idvc-wrapped-signed-idvc-revoked.json"),
      verbose: true,
      network: "sepolia",
    });
    expect(signaleSuccessSpy).toHaveBeenCalledTimes(2);
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(1, "The document has not been tampered");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(2, "The document has been issued");
    expect(signaleErrorSpy).toHaveBeenCalledTimes(2);
    expect(signaleErrorSpy).toHaveBeenNthCalledWith(1, "The document is not valid");
    expect(signaleErrorSpy).toHaveBeenNthCalledWith(2, "The issuer identity has not been verified");
  });
  it("should work on did-idvc-wrapped-signed.json", async () => {
    await handler({
      document: path.resolve("examples", "v4", "signed-documents", "did-idvc-wrapped-signed.json"),
      verbose: true,
      network: "sepolia",
    });
    expect(signaleSuccessSpy).toHaveBeenCalledTimes(4);
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(1, "The document is valid");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(2, "The document has not been tampered");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(3, "The document has been issued");
    expect(signaleSuccessSpy).toHaveBeenNthCalledWith(4, "The issuer identity has been verified");
  });
});
