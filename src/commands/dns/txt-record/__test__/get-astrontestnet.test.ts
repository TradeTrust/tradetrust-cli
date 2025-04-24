import { handler } from "../get";

describe("get", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should return dns-txt", async () => {
    const consoleSpy = jest.spyOn(console, "table");
    await handler({ location: "dev-astronlayer2.bitfactory.cn" });

    const mockCall1 = consoleSpy.mock.calls[0][0];
    mockCall1.sort((a: any, b: any) => {
      if (a.netId < b.netId) return -1;
      if (a.netId > b.netId) return 1;
      if (a.addr < b.addr) return -1;
      if (a.addr > b.addr) return 1;
      return 0;
    });
    // dns-txt
    expect(mockCall1).toMatchSnapshot();
  });
});
