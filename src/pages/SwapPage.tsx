import React, {useEffect, useState} from "react";
import {
    formatNumber,
    parseTokenAmount,
    parseTokenWithDecimals,
    toReadableNumber,
    toReadableNumberString,
    wallet
} from "~utils/near";
import {getTokenMetadata, TokenMetadata} from "~utils/token";
import {InputNumber, Avatar, Divider} from "antd";
import { CreditCardOutlined, SwapOutlined, DownOutlined } from "@ant-design/icons";
import {MaxButton, MyButton} from "~components/button";
//@ts-ignore
import nearIcon from "~assets/imgs/brand-icon.png";
//@ts-ignore
import wNearIcon from "~assets/imgs/w-NEAR-no-border.png";
import SelectTokenModal from "~components/modal/SelectTokenModal";
import {poolContract, swap} from "~utils/simple-pool.rs";
import {IntervalSpinner} from "~components/spiner/IntervalSpinner";
import BN from "bn.js";

const SwapPage = () => {
    const [isVisibleSelectFromToken, setVisibleSelectFromToken] = useState(false);
    const [isVisibleSelectToToken, setVisibleSelectToToken] = useState(false);
    const [fromToken, setFromToken] = useState<TokenMetadata>(getTokenMetadata("VBIC"));
    const [toToken, setToToken] = useState<TokenMetadata>(getTokenMetadata("vUSN"));
    const [fromTokenBalance, setFromTokenBalance] = useState(new BN(0));
    const [toTokenBalance, setToTokenBalance] = useState(new BN(0));
    const [inAmountValue, setInAmountValue] = useState(new BN('0'));
    const [outAmountValue, setOutAmountValue] = useState(new BN('0'));
    const [tokenPrice, setTokenPrice] = useState(new BN("0"));
    const [slippage, setSlippage] = useState(1);
    const [priceDiff, setPriceDiff] = useState(0);
    const [poolFee, setPoolFee] = useState(0);
    const [loading, setLoading] = useState(false);

    const reverseSwapToken = () => {
        let toTokenCache = toToken;
        setToToken(fromToken);
        setFromToken(toTokenCache);
    }

    const onSelectFromToken = (item: TokenMetadata) => {
      setFromToken(item);
      setVisibleSelectFromToken(false);
    }

    const onSelectToToken = (item: TokenMetadata) => {
        setToToken(item);
        setVisibleSelectToToken(false);
    }

    const getAccountBalanceByToken = async (contractId: string) => {
        let accountId = wallet.getAccountId();
        let balance = await wallet.account().viewFunction(
          contractId,
          "ft_balance_of",
          { account_id: accountId }
        );

        return balance;
    }

    const onChangeFromToken = async () => {
        let balance = await getAccountBalanceByToken(fromToken.contractId);
        setFromTokenBalance(new BN(balance));
    }

    const onChangeToToken = async () => {
        let balance = await getAccountBalanceByToken(toToken.contractId);
        setToTokenBalance(new BN(balance));
    }

    // @ts-ignore
    const getReturnSwap = async () => {
        //@ts-ignore
        let returnBalance: string = await poolContract.get_return({token_in: fromToken.contractId, amount_in: inAmountValue.toString(), token_out: toToken.contractId});

        if(tokenPrice) {
            let spotPrice = parseInt(inAmountValue.toString()) * toReadableNumber(toToken.decimals, tokenPrice.toString());
            let slippage =  Math.floor(((spotPrice - parseInt(returnBalance)) * 100 / spotPrice) * 100) / 100;
            setSlippage(slippage <= 1 ? 1: slippage);
            if (spotPrice >= parseInt(returnBalance)) {
                setPriceDiff(toReadableNumber(toToken.decimals, (spotPrice - parseInt(returnBalance)).toLocaleString("fullwide", {useGrouping:false})));
            }
        }

        setOutAmountValue(new BN(returnBalance));
    }

    const getReturnForOne = async () => {
        // @ts-ignore
        let inputBalance = parseTokenAmount(1, fromToken.decimals).toLocaleString("fullwide", {useGrouping:false});

        //@ts-ignore
        let returnBalance: string = await poolContract.get_return({token_in: fromToken.contractId, amount_in: inputBalance, token_out: toToken.contractId});
        setTokenPrice(new BN(returnBalance));
    }

    const getPoolFee = async () => {
        //@ts-ignore
        let fee: string = await poolContract.get_fee();
        setPoolFee(parseInt(fee)/ 10000);
    }

    const handleSubmit = async () => {
        if (!inAmountValue || inAmountValue.eq(new BN(0)) || inAmountValue.gt(fromTokenBalance) || slippage > 1 || loading) return;
        try {
            setLoading(true);
            await swap(fromToken.contractId, inAmountValue, toToken.contractId, outAmountValue.mul(new BN(99)).div(new BN(100)));
        } catch (e) {
            console.log("Error: ", e);
        } finally {
            setLoading(false);
        }
    }

    const onRefreshData = () => {
        if (toToken && fromToken) {
            getReturnForOne();
        }

        getPoolFee();
        onChangeToToken();
        onChangeToToken();
    }

    useEffect(() => {
        if (inAmountValue.gt(new BN(0))) {
            getReturnSwap();
        } else {
            setOutAmountValue(new BN(0))
        }
    }, [inAmountValue])

    useEffect(() => {
        onChangeFromToken();
    }, [fromToken]);

    useEffect(() => {
        onChangeToToken();
    }, [toToken]);

    useEffect(() => {
        if (toToken && fromToken) {
            getReturnForOne();
            setInAmountValue(new BN(0));
            setOutAmountValue(new BN(0));
        }
    }, [fromToken, toToken]);

    useEffect(() => {
        getPoolFee();
    }, []);

    return (
      <div className="staking w-full">
          <section className="w-full md:w-560px lg:w-560px xl:w-560px m-auto relative xs:px-2">
              <div className="flex flex-row justify-between items-center">
                  <h1 className={"text-white text-3xl"}>
                      Swap
                  </h1>
                  <IntervalSpinner onProgressSuccess={onRefreshData} />
              </div>

              <div className={"flex flex-col mt-5 justify-between"}>
                  <div className={"flex flex-col justify-between mb-2 bg-cardBg rounded-2xl p-5 w-full"}>
                      <div className={"input-form mt-5 mb-3"}>
                          <p className="flex flex-row items-center text-primaryText mb-2">
                              <CreditCardOutlined />
                              <span className="text-primaryText mr-2 ml-1">Balance:</span>
                              {toReadableNumberString(fromToken.decimals, fromTokenBalance.toString())}
                              <span className="text-primary ml-1">{fromToken.symbol}</span>
                          </p>
                          <div className="flex flex-row items-center">
                              <div className="w-2/3">
                                  <InputNumber min={0}  className={"staking-input font-bold rounded"}
                                               addonAfter={<MaxButton onClick={() => setInAmountValue(fromTokenBalance)} />}
                                               value={toReadableNumber(fromToken.decimals, inAmountValue.toString())}
                                               onChange={(value) => setInAmountValue(parseTokenAmount(value, fromToken.decimals))}
                                               defaultValue={0}
                                  />
                              </div>
                              <div className="flex flex-row items-center justify-end flex-1">
                                  <div onClick={() => setVisibleSelectFromToken(true)} className="flex flex-row items-center rounded-full hover:bg-acccountTab py-2 px-4 cursor-pointer">
                                      <span className="mr-1">{fromToken.symbol}</span>
                                      <Avatar size={30} src={fromToken.icon} />
                                      <DownOutlined className="ml-2" />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <Divider plain><SwapOutlined onClick={reverseSwapToken} className="cursor-pointer" style={{fontSize: 24, transform: "rotate(90deg)", padding: 5}} /></Divider>

                      <div className={"input-form mt-2 mb-4"}>
                          <p className="flex flex-row items-center text-primaryText mb-2">
                              <CreditCardOutlined />
                              <span className="text-primaryText mr-2 ml-1">Balance:</span>
                              {toReadableNumberString(toToken.decimals, toTokenBalance.toString())}
                              <span className="text-primary ml-1">{toToken.symbol}</span>
                          </p>
                          <div className="flex flex-row items-center">
                              <div className="w-2/3">
                                  <InputNumber min={0} disabled className={"staking-input font-bold rounded w-full"} value={toReadableNumber(toToken.decimals, outAmountValue.toString())} defaultValue={0} />
                              </div>
                              <div className="flex flex-row items-center justify-end flex-1">
                                  <div onClick={() => setVisibleSelectToToken(true)} className="flex flex-row items-center rounded-full hover:bg-acccountTab py-2 px-4 cursor-pointer">
                                      <span className="mr-1">{toToken.symbol}</span>
                                      <Avatar size={30} src={toToken.icon} />
                                      <DownOutlined className="ml-2" />
                                  </div>
                              </div>
                          </div>
                      </div>
                      <Divider plain><span className="text-xs">Details</span></Divider>
                      <div className={"swap-detail mb-4"}>
                          <div className="mb-1 flex justify-between">
                              <span className="text-primaryText text-xs mr-2 ml-1">Minimum received:</span>
                              <span className="text-white text-xs">{Math.floor((toReadableNumber(toToken.decimals, outAmountValue.toString()) * 99 / 100) * 100) / 100} {toToken.symbol}</span>
                          </div>
                          <div className="mb-1 flex justify-between">
                              <span className="text-primaryText text-xs mr-2 ml-1">Price impact:</span>
                              <span className="text-white text-xs">1 {fromToken.symbol} ≈ {toReadableNumberString(toToken.decimals, tokenPrice.toString())} {toToken.symbol}</span>
                          </div>
                          <div className="mb-1 flex justify-between">
                              <span className="text-primaryText text-xs mr-2 ml-1">Slippage:</span>
                              <span className={`${slippage == 1 ? "text-primary":"text-red-700"} text-xs`}>{Math.floor(slippage * 100) / 100}% / -{
                                  slippage == 1 ? Math.floor((toReadableNumber(toToken.decimals, outAmountValue.toString()) / 100) * 100) / 100 : priceDiff.toString()
                              } {toToken.symbol}</span>
                          </div>
                          <div className="mb-1 flex justify-between">
                              <span className="text-primaryText text-xs mr-2 ml-1">Pool fee:</span>
                              <span className="text-white text-xs">{poolFee * 100}%</span>
                          </div>
                      </div>
                      <MyButton onClick={handleSubmit} loading={loading} disable={!inAmountValue || inAmountValue.eq(new BN(0)) || inAmountValue.gt(fromTokenBalance) || slippage > 1} text="Swap"/>
                  </div>
              </div>
          </section>

          <SelectTokenModal ignoreToken={toToken} onSelectToken={onSelectFromToken} isModalVisible={isVisibleSelectFromToken} onCancel={() => setVisibleSelectFromToken(false)} />
          <SelectTokenModal ignoreToken={fromToken} onSelectToken={onSelectToToken} isModalVisible={isVisibleSelectToToken} onCancel={() => setVisibleSelectToToken(false)} />
      </div>
    )
}


export default SwapPage;