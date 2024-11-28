import { TitleEscrow__factory, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { Wallet } from "ethers";

import { BaseTitleEscrowCommand as TitleEscrowRejectTransferCommand } from "../../commands/title-escrow/title-escrow-command.type";
import { rejectTransferOwnerHolder } from "./rejectTransferOwnerHolder";

jest.mock("@tradetrust-tt/token-registry/contracts");

const transferOwnerHolderParams: TitleEscrowRejectTransferCommand = {
  remark: "0xabcd",
  encryptionKey: "1234",
  tokenId: "0xzyxw",
  tokenRegistry: "0x1234",
  network: "sepolia",
  maxPriorityFeePerGasScale: 1,
  dryRun: false,
};

describe("title-escrow", () => {
  describe("reject Owner and Holder of transferable record", () => {
    const mockedTradeTrustTokenFactory: jest.Mock<TradeTrustToken__factory> = TradeTrustToken__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectERC721: jest.Mock = mockedTradeTrustTokenFactory.connect;

    const mockedTokenFactory: jest.Mock<TitleEscrow__factory> = TitleEscrow__factory as any;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore mock static method
    const mockedConnectTokenFactory: jest.Mock = mockedTokenFactory.connect;
    const mockedOwnerOf = jest.fn();
    const mockRejectTransferOwnerHolder = jest.fn();
    const mockCallStaticRejectTransferOwnerHolder = jest.fn().mockResolvedValue(undefined);
    const mockedTitleEscrowAddress = "0x2133";
    mockedOwnerOf.mockReturnValue(mockedTitleEscrowAddress);
    mockRejectTransferOwnerHolder.mockReturnValue({
      hash: "hash",
      wait: () => Promise.resolve({ transactionHash: "transactionHash" }),
    });

    const mockedPrevBeneficiary = "0xdssfs";
    const mockGetPrevBeneficiary = jest.fn();
    mockGetPrevBeneficiary.mockReturnValue(mockedPrevBeneficiary);

    const mockedPrevHolder = "0xdssfs";
    const mockGetPrevHolder = jest.fn();
    mockGetPrevHolder.mockReturnValue(mockedPrevHolder);

    mockedConnectERC721.mockReturnValue({
      ownerOf: mockedOwnerOf,
    });
    mockedConnectTokenFactory.mockReturnValue({
      prevBeneficiary: mockGetPrevBeneficiary,
      prevHolder: mockGetPrevHolder,
      rejectTransferOwners: mockRejectTransferOwnerHolder,
      callStatic: {
        rejectTransferOwners: mockCallStaticRejectTransferOwnerHolder,
      },
    });

    beforeEach(() => {
      delete process.env.OA_PRIVATE_KEY;
      mockedTradeTrustTokenFactory.mockClear();
      mockedConnectERC721.mockClear();
      mockedTokenFactory.mockClear();
      mockedConnectTokenFactory.mockClear();
      mockedOwnerOf.mockClear();
      mockRejectTransferOwnerHolder.mockClear();
      mockCallStaticRejectTransferOwnerHolder.mockClear();
    });

    it("should pass in the correct params and call the following procedures to invoke a reject OwnerHolder of a transferable record", async () => {
      const privateKey = "0000000000000000000000000000000000000000000000000000000000000001";
      await rejectTransferOwnerHolder({
        ...transferOwnerHolderParams,
        key: privateKey,
      });

      const passedSigner: Wallet = mockedConnectERC721.mock.calls[0][1];

      expect(passedSigner.privateKey).toBe(`0x${privateKey}`);
      expect(mockedConnectERC721).toHaveBeenCalledWith(transferOwnerHolderParams.tokenRegistry, passedSigner);
      expect(mockedOwnerOf).toHaveBeenCalledWith(transferOwnerHolderParams.tokenId);
      expect(mockedConnectTokenFactory).toHaveBeenCalledWith(mockedTitleEscrowAddress, passedSigner);
      expect(mockCallStaticRejectTransferOwnerHolder).toHaveBeenCalledTimes(1);
      expect(mockRejectTransferOwnerHolder).toHaveBeenCalledTimes(1);
    });
  });
});