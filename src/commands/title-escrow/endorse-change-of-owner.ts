import { Argv } from "yargs";
import { error, info, success, warn } from "signale";
import { getLogger } from "../../logger";
import { transferOwners } from "../../implementations/title-escrow/transferOwners";
import { TitleEscrowEndorseTransferOfOwnersCommand } from "./title-escrow-command.type";
import { withGasPriceOption, withNetworkAndWalletSignerOption } from "../shared";
import { displayTransactionPrice, getErrorMessage, getEtherscanAddress } from "../../utils";
import { NetworkCmdName } from "../../common/networks";

const { trace } = getLogger("title-escrow:endorse-change-of-owner");

export const command = "endorse-change-owner [options]";

export const describe = "Endorses the change of owner of transferable record to another address";

export const builder = (yargs: Argv): Argv =>
  withGasPriceOption(
    withNetworkAndWalletSignerOption(
      yargs
        .option("token-registry", {
          alias: "tr",
          description: "Address of the token registry that the transferable record was issued from",
          type: "string",
          demandOption: true,
        })
        .option("tokenId", {
          description: "Merkle root (document hash) of the transferable record",
          type: "string",
          demandOption: true,
        })
        .option("newOwner", {
          alias: "newBeneficiary",
          description: "Address of the new owner of the transferable record",
          type: "string",
          demandOption: true,
        })
        .option("newHolder", {
          description: "Address of the new holder of the transferable record",
          type: "string",
          demandOption: true,
        })
        .option("remark", {
          alias: "remark",
          description: "Remark for the change of owner",
          type: "string",
        })
        .option("encryptionKey", {
          alias: "encryptionKey",
          description: "Encryption key for the document",
          type: "string",
        })
    )
  );

export const handler = async (args: TitleEscrowEndorseTransferOfOwnersCommand): Promise<void> => {
  trace(`Args: ${JSON.stringify(args, null, 2)}`);
  try {
    info(
      `Connecting to the registry ${args.tokenRegistry} and attempting to endorse the change of owner of the transferable record ${args.tokenId} to new owner at ${args.newOwner} and new holder at ${args.newHolder}`
    );
    warn(
      `Please note that you have to be both the holder and owner of the transferable record, otherwise this command will fail.`
    );
    const transaction = await transferOwners(args);
    const network = args.network as NetworkCmdName;

    displayTransactionPrice(transaction, network);

    const { transactionHash } = transaction;
    success(
      `Transferable record with hash ${args.tokenId}'s holder has been successfully endorsed to new owner with address ${args.newOwner} and new holder with address: ${args.newHolder}`
    );
    info(`Find more details at ${getEtherscanAddress({ network: args.network })}/tx/${transactionHash}`);
  } catch (e) {
    error(getErrorMessage(e));
  }
};
