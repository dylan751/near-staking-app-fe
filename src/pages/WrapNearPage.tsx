import React, {useEffect, useState} from "react";
import {formatNumber, parseTokenAmount, parseTokenWithDecimals, wallet} from "~utils/near";
import {getTokenMetadata} from "~utils/token";
import {InputNumber, Avatar, Divider} from "antd";
import { CreditCardOutlined, SwapOutlined } from "@ant-design/icons";
import {MaxButton, MyButton} from "~components/button";
//@ts-ignore
import nearIcon from "~assets/imgs/brand-icon.png";
//@ts-ignore
import wNearIcon from "~assets/imgs/w-NEAR-no-border.png";
import {formatNearAmount, parseNearAmount} from "near-api-js/lib/utils/format";
import {depositNear, withdrawNear, wrapNearContract} from "~utils/wrapnear-contract";

const WrapNearPage = () => {
    const [isWrap, setIsWrap] = useState(true);
    const [nearBalance, setNearBalance] = useState(0);
    const [wNearBalance, setwNearBalance] = useState(0);
    const [inAmountValue, setInAmountValue] = useState(0);
    const [outAmountValue, setOutAmountValue] = useState(0);
    const [loading, setLoading] = useState(false);

    const getAccountBalance = async () => {
      if (wallet.isSignedIn()) {
          let balance = await wallet.account().getAccountBalance();
          setNearBalance(parseInt(balance.available));
      }
    }

    const getWrapNearBalance = async () => {
        if (wallet.isSignedIn()) {
            //@ts-ignore
            let balance = await wrapNearContract.ft_balance_of({account_id: wallet.getAccountId()});
            if (balance) {
                setwNearBalance(parseInt(balance));
            }
        }
    }

    const handleSubmit = async () => {
        if (!inAmountValue || inAmountValue <= 0 || inAmountValue > parseTokenWithDecimals(isWrap ? nearBalance: wNearBalance, 24) - (isWrap ? 1:0)) return;
        setLoading(true);
        try {
            if (isWrap) {
                await depositNear(inAmountValue);
            } else {
                await withdrawNear(inAmountValue);
            }
        } catch (e) {
            console.log("Error: ", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setOutAmountValue(inAmountValue);
    }, [inAmountValue])

    useEffect(() => {
        setInAmountValue(0);
    }, [isWrap]);

    useEffect(() => {
        getAccountBalance();
        getWrapNearBalance();
    }, []);

    return (
      <div className="staking w-full">
          <section className="w-full md:w-560px lg:w-560px xl:w-560px m-auto relative xs:px-2">
              <div className="flex flex-row justify-between items-center">
                  <h1 className={"text-white text-3xl"}>
                      Wrap NEAR
                  </h1>
              </div>

              <div className={"flex flex-col mt-5 justify-between"}>
                  <div className={"flex flex-col justify-between mb-2 bg-cardBg rounded-2xl p-5 w-full"}>
                      <p className={"text-xs text-primaryText"}>Wrapping NEAR allows you to trade on Swap/Pools. Make sure to <span className="text-white">leave 1 NEAR</span> for gas fees to unwrap your NEAR.</p>
                      <div className={"input-form mt-5 mb-3"}>
                          <p className="flex flex-row items-center text-primaryText mb-2">
                              <CreditCardOutlined />
                              <span className="text-primaryText mr-2 ml-1">Balance:</span>
                              {parseTokenWithDecimals(isWrap ? nearBalance: wNearBalance, 24)}
                              {
                                  isWrap ? <span className="text-primary ml-1">NEAR</span> : <span className="text-primary ml-1">wNEAR</span>
                              }
                          </p>
                          <div className="flex flex-row items-center">
                              <div className="w-2/3">
                                  <InputNumber min={0}  className={"staking-input font-bold rounded"} addonAfter={<MaxButton onClick={() => setInAmountValue(parseTokenWithDecimals(isWrap ? nearBalance: wNearBalance, 24) - (isWrap ? 1:0))} />} value={inAmountValue} onChange={(value) => setInAmountValue(value)} defaultValue={0} />
                              </div>
                              {
                                  isWrap ?
                                    <div className="flex flex-row items-center justify-end flex-1">
                                        <span className="mr-1">NEAR</span>
                                        <Avatar src={nearIcon} />
                                    </div>:
                                    <div className="flex flex-row items-center justify-end flex-1">
                                        <span className="mr-1">wNEAR</span>
                                        <Avatar src={wNearIcon} />
                                    </div>
                              }
                          </div>
                      </div>

                      <Divider plain><SwapOutlined onClick={() => setIsWrap(!isWrap)} className="cursor-pointer" style={{fontSize: 24, transform: "rotate(90deg)", padding: 5}} /></Divider>

                      <div className={"input-form mt-2 mb-4"}>
                          <p className="flex flex-row items-center text-primaryText mb-2">
                              <CreditCardOutlined />
                              <span className="text-primaryText mr-2 ml-1">Balance:</span>
                              {parseTokenWithDecimals(isWrap ? wNearBalance: nearBalance, 24)}
                              {
                                  isWrap ? <span className="text-primary ml-1">wNEAR</span> : <span className="text-primary ml-1">NEAR</span>
                              }
                          </p>
                          <div className="flex flex-row items-center">
                              <div className="w-2/3">
                                  <InputNumber min={0} disabled className={"staking-input font-bold rounded w-full"} value={outAmountValue} defaultValue={0} />
                              </div>

                              { isWrap ?
                                  <div className="flex flex-row items-center justify-end flex-1">
                                      <span className="mr-1">wNEAR</span>
                                      <Avatar src={wNearIcon} />
                                  </div>:
                                  <div className="flex flex-row items-center justify-end flex-1">
                                      <span className="mr-1">NEAR</span>
                                      <Avatar src={nearIcon} />
                                  </div>
                              }
                          </div>
                      </div>
                      <MyButton onClick={handleSubmit} loading={loading} disable={
                          !inAmountValue || inAmountValue <= 0 || inAmountValue > parseTokenWithDecimals(isWrap ? nearBalance: wNearBalance, 24) - (isWrap ? 1:0)
                      } text="Submit"/>
                  </div>
              </div>
          </section>
      </div>
    )
}


export default WrapNearPage;