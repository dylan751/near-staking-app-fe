import { Contract } from "near-api-js";
import {
    wallet,
    config,
    Transaction,
    executeMultipleTransactions, FT_STORAGE_AMOUNT, ONE_YOCTO_NEAR
} from "~utils/near";
import {formatNearAmount, parseNearAmount} from "near-api-js/lib/utils/format";

const wrapNearContract = new Contract(
  wallet.account(),
  config.WRAP_NEAR_CONTRACT,
  {
      viewMethods: ["ft_metadata", "ft_balance_of", "storage_balance_of"],
      changeMethods: ["ft_transfer", "ft_transfer_call", "near_deposit", "near_withdraw"]
  }
)

const depositNear = async (amount: number) => {
    // Execute multi transaction: 1. deposit staking storage, 2. ft transfer call
    let depositNear: Transaction = {
        receiverId: config.WRAP_NEAR_CONTRACT,
        functionCalls: [
            {
                methodName: "near_deposit",
                args: {},
                gas: "10000000000000",
                amount: amount.toString()
            }
        ]
    }

    let transactions: Transaction[] = [depositNear];

    // Check storage balance
    //@ts-ignore
    let storageBalance: any = await wrapNearContract.storage_balance_of({ account_id: wallet.getAccountId() });

    if (!storageBalance || storageBalance.total == '0') {
        let stakingDepositStorage: Transaction = {
            receiverId: config.WRAP_NEAR_CONTRACT,
            functionCalls: [
                {
                    methodName: "storage_deposit",
                    args: {
                        account_id: wallet.getAccountId()
                    },
                    gas: "10000000000000",
                    amount: "0.00125"
                }
            ]
        };

        transactions.unshift(stakingDepositStorage);
    }

    await executeMultipleTransactions(transactions);
}

const withdrawNear = async (amount: number) => {
    //@ts-ignore
    await wrapNearContract.near_withdraw(
      { amount: parseNearAmount(amount.toString()) },
      30000000000000,
      1
    );
}

export {
    wrapNearContract,
    depositNear,
    withdrawNear
};