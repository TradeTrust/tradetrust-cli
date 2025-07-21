import signale from "signale";
import { getLogger } from "../../logger";
import { getWalletOrSigner } from "../utils/wallet";
import { TokenRegistryIssueCommand } from "../../commands/token-registry/token-registry-command.type";
import { TransactionReceipt } from "@ethersproject/providers";
import { canEstimateGasPrice, getGasFees } from "../../utils";
import { BigNumber } from "ethers";
import { mint } from "@trustvc/trustvc";

const { trace } = getLogger("token-registry:issue");

export const issueToTokenRegistry = async ({
  address,
  beneficiary,
  holder,
  tokenId,
  remark,
  encryptionKey,
  network,
  dryRun,
  ...rest
}: TokenRegistryIssueCommand): Promise<TransactionReceipt> => {
  const wallet = await getWalletOrSigner({ network, ...rest });
  let transactionOptions: { maxFeePerGas?: BigNumber; maxPriorityFeePerGas?: BigNumber } = {};

  if (dryRun) {
    console.log("🔧 Dry run mode is currently undergoing upgrades and will be available soon.");
    process.exit(0);
  }

  if (canEstimateGasPrice(network)) {
    const gasFees = await getGasFees({ provider: wallet.provider, ...rest });
    trace(`Gas maxFeePerGas: ${gasFees.maxFeePerGas}`);
    trace(`Gas maxPriorityFeePerGas: ${gasFees.maxPriorityFeePerGas}`);
    transactionOptions = {
      maxFeePerGas: gasFees.maxFeePerGas as BigNumber,
      maxPriorityFeePerGas: gasFees.maxPriorityFeePerGas as BigNumber,
    };
  }

  const transaction = await mint(
    { tokenRegistryAddress: address },
    wallet,
    { beneficiaryAddress: beneficiary, holderAddress: holder, tokenId, remarks: remark },
    { id: encryptionKey, ...transactionOptions }
  );

  trace(`Tx hash: ${transaction.hash}`);
  trace(`Block Number: ${transaction.blockNumber}`);
  signale.await(`Waiting for transaction ${transaction.hash} to be mined`);
  return transaction.wait();
};
