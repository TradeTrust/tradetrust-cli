import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateEndorseChangeOwner } from "./helpers";
import { TitleEscrowEndorseTransferOfOwnersCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:endorseChangeOfOwner");

export const transferOwners = async ({
  tokenRegistry: address,
  tokenId,
  newHolder,
  newOwner,
  network,
  dryRun,
  ...rest
}: TitleEscrowEndorseTransferOfOwnersCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  await validateEndorseChangeOwner({ newHolder, newOwner, titleEscrow });
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.transferOwners(newOwner, newHolder, "0x"),
      network,
    });
    process.exit(0);
  }
  let transaction;
  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await titleEscrow.callStatic.transferOwners(newOwner, newHolder, "0x");
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.transferOwners(newOwner, newHolder, "0x", { ...gasFees });
  } else {
    await titleEscrow.callStatic.transferOwners(newOwner, newHolder, "0x");
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.transferOwners(newOwner, newHolder, "0x");
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
