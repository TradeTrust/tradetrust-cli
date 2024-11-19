import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateNominateBeneficiary, validateRemarks } from "./helpers";
import { TitleEscrowRejectTransferCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:rejectTransferOwner");

export const rejectTransferOwner = async ({
  tokenRegistry: address,
  tokenId,
  remark,
  network,
  dryRun,
  ...rest
}: TitleEscrowRejectTransferCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  await validateRemarks(remark);
  if (dryRun) {
    await validateRemarks(remark);
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.rejectTransferBeneficiary(remark),
      network,
    });
    process.exit(0);
  }
  let transaction;
  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await titleEscrow.callStatic.rejectTransferBeneficiary(remark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.rejectTransferBeneficiary(remark, { ...gasFees });
  } else {
    await titleEscrow.callStatic.rejectTransferBeneficiary(remark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.rejectTransferBeneficiary(remark);
  }

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
