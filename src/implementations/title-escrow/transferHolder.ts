import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { connectToTitleEscrow, validateAndEncryptRemark } from "./helpers";
import { TitleEscrowTransferHolderCommand } from "../../commands/title-escrow/title-escrow-command.type";

import { dryRunMode } from "../utils/dryRun";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";

const { trace } = getLogger("title-escrow:transferHolder");

export const transferHolder = async ({
  tokenRegistry: address,
  newHolder: to,
  remark,
  encryptionKey,
  tokenId,
  network,
  dryRun,
  ...rest
}: TitleEscrowTransferHolderCommand): Promise<TransactionReceipt> => {
  console.log(to, remark);
  const wallet = await getWalletOrSigner({ network, ...rest });
  const titleEscrow = await connectToTitleEscrow({ tokenId, address, wallet });
  const encryptedRemark = validateAndEncryptRemark(remark, encryptionKey);
  if (dryRun) {
    await dryRunMode({
      estimatedGas: await titleEscrow.estimateGas.transferHolder(to, encryptedRemark),
      network,
    });
    process.exit(0);
  }
  let transaction;
  if (canEstimateGasPrice(network)) {
    console.log("here1");
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    await titleEscrow.callStatic.transferHolder(to, encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.transferHolder(to, encryptedRemark, { ...gasFees });
    console.log("here2");
  } else {
    console.log("here3");
    await titleEscrow.callStatic.transferHolder(to, encryptedRemark);
    signale.await(`Sending transaction to pool`);
    transaction = await titleEscrow.transferHolder(to, encryptedRemark);
    console.log("here4");
  }
  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
