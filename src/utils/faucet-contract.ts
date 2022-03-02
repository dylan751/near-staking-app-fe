import { Contract } from "near-api-js";
import {
    wallet,
    config,
    Transaction,
    ONE_YOCTO_NEAR,
    STAKING_STORAGE_AMOUNT,
    executeMultipleTransactions, FT_STORAGE_AMOUNT
} from "~utils/near";
import ftContract from "~utils/ft-contract";

const faucetContract = new Contract(
  wallet.account(),
  config.VBI_FAUCET_FT_CONTRACT,
  {
      viewMethods: ["get_faucet_info", "get_shared_balance_of"],
      changeMethods: ["faucet_token"]
  }
)

const faucet = async (amount: string) => {
    // Execute multi transaction: 1. deposit staking storage, 2. ft transfer call
    let faucetCall: Transaction = {
        receiverId: config.VBI_FAUCET_FT_CONTRACT,
        functionCalls: [
            {
                methodName: "faucet_token",
                args: {
                    amount
                },
                gas: "60000000000000",
                amount: FT_STORAGE_AMOUNT
            }
        ]
    }

    let transactions: Transaction[] = [faucetCall];

    // Check storage balance
    //@ts-ignore
    let storageBalance: any = await ftContract.storage_balance_of({ account_id: wallet.getAccountId() });

    if (!storageBalance) {
        let stakingDepositStorage: Transaction = {
            receiverId: config.VBI_FT_CONTRACT,
            functionCalls: [
                {
                    methodName: "storage_deposit",
                    args: {
                        account_id: wallet.getAccountId()
                    },
                    gas: "10000000000000",
                    amount: FT_STORAGE_AMOUNT
                }
            ]
        };

        transactions.unshift(stakingDepositStorage);
    }

    await executeMultipleTransactions(transactions);
}

export {
    faucetContract,
    faucet
}