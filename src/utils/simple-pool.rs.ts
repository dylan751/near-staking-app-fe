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
import BN from "bn.js";

const poolContract = new Contract(
  wallet.account(),
  config.VBI_SIMPLE_POOL_CONTRACT,
  {
      viewMethods: ["get_return", "get_fee", "storage_balance_of"],
      changeMethods: ["swap", "storage_deposit"]
  }
);

/**
 * Handle step
 * 1. Check and register account to simple pool contract
 * 2. Deposit token in to simple pool contract
 * 3. Swap token
 * 4. Check and register account to token out contract
 * 5. Withdraw all amount of token out
 * @param tokenIn
 * @param amountIn
 * @param tokenOut
 * @param minAmountOut
 */
const swap = async (tokenIn: string, amountIn: BN, tokenOut: string, minAmountOut: BN) => {

    if (tokenIn == tokenOut || !amountIn) return;

    let accountId = wallet.getAccountId();

    let tokenInTransaction: Transaction = {
        receiverId: tokenIn,
        functionCalls: [
            {
                methodName: "ft_transfer_call",
                args: {
                    receiver_id: config.VBI_SIMPLE_POOL_CONTRACT,
                    amount: amountIn.toString(),
                    msg: ""
                },
                gas: "60000000000000",
                amount: ONE_YOCTO_NEAR
            }
        ]
    }

    let poolCallActions: any[] = [
        {
            methodName: "swap",
            args: {
                token_in: tokenIn,
                amount_in: amountIn.toString(),
                token_out: tokenOut,
                min_amount_out: minAmountOut.toString()
            },
            gas: "60000000000000",
            amount: ONE_YOCTO_NEAR
        },
        {
            methodName: "withdraw",
            args: {
                token_id: tokenOut
            },
            gas: "60000000000000",
            amount: ONE_YOCTO_NEAR
        }
    ];

    let poolTransaction: Transaction = {
        receiverId: config.VBI_SIMPLE_POOL_CONTRACT,
        functionCalls: poolCallActions
    };

    let transactions = [tokenInTransaction, poolTransaction];

    let tokenOutStorageBalance = await wallet.account().viewFunction(
      tokenOut,
      "storage_balance_of",
      {account_id: accountId}
    );
    if (!tokenOutStorageBalance) {
        transactions.unshift({
            receiverId: tokenOut,
            functionCalls: [
                {
                    methodName: "storage_deposit",
                    args: {
                        account_id: accountId
                    },
                    gas: "30000000000000",
                    amount: FT_STORAGE_AMOUNT
                }
            ]
        })
    };

    //@ts-ignore
    let poolStorageBalance = await poolContract.storage_balance_of({account_id: wallet.getAccountId()});
    if (!parseInt(poolStorageBalance) || poolStorageBalance == "0") {
        transactions.unshift({
            receiverId: config.VBI_SIMPLE_POOL_CONTRACT,
            functionCalls: [
                {
                    methodName: "register_account",
                    args: {
                        account_id: accountId.toString()
                    },
                    gas: "30000000000000",
                    amount: FT_STORAGE_AMOUNT
                }
            ]
        })
    };

    await executeMultipleTransactions(transactions);

};

export {
    poolContract,
    swap
}