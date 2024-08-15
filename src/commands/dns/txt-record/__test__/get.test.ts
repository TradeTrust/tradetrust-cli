import { handler } from "../get";

describe("get", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should return dns-txt", async () => {
    const consoleSpy = jest.spyOn(console, "table");
    await handler({ location: "tradetrust.io" });

    // dns-txt
    expect(consoleSpy).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({
          addr: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/g),
          dnssec: expect.any(Boolean),
          net: expect.stringMatching(/^[a-z]+$/),
          netId: expect.stringMatching(/^[0-9]+$/),
          type: "openatts",
        }),
      ])
    );
    // dns-did
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({
          algorithm: "dns-did",
          publicKey: expect.stringMatching(/^did:ethr:0x[a-fA-F0-9]{40}#controller$/g),
          version: expect.stringMatching(/^[0-9.]+$/),
          dnssec: expect.any(Boolean),
          type: "openatts",
        }),
      ])
    );
  });
});
