import React, {useEffect, useState} from "react";
import {IntervalSpinner} from "~components/spiner/IntervalSpinner";
import {formatNumber, login, parseTokenAmount, parseTokenWithDecimals, wallet} from "~utils/near";
import {getTokenMetadata} from "~utils/token";
import {InputNumber} from "antd";
import {MyButton, MaxButton} from "~components/button";
import {faucet, faucetContract} from "~utils/faucet-contract";
import {CreditCardOutlined} from "@ant-design/icons";

const FaucetPage = () => {
    const [faucetInfo, setFaucetInfo] = useState(
      {
          totalBalanceShare: 0,
          totalShared: 0,
          totalAccountShared: 0,
          maxSharePerAccount: 0,
          isPaused: false
      }
    );
    const [faucetValue, setFaucetValue] = useState(0);
    const [accountBalanceShare, setAccountBalanceShare] = useState(0);
    const [faucetLoading, setFaucetLoading] = useState(false);

    const getFaucetInfo = async () => {
        //@ts-ignore
        let faucetInfo = await faucetContract.get_faucet_info();

        setFaucetInfo({
            totalBalanceShare: parseInt(faucetInfo.total_balance_share),
            totalShared: parseInt(faucetInfo.total_shared),
            totalAccountShared: parseInt(faucetInfo.total_account_shared),
            maxSharePerAccount: parseInt(faucetInfo.max_share_per_account),
            isPaused: faucetInfo.is_paused
        })
    }

    const getAccountBalanceShare = async () => {
        //@ts-ignore
        let balance: string = await faucetContract.get_shared_balance_of({account_id: wallet.getAccountId()});
        setAccountBalanceShare(parseInt(balance));
    }

    const refreshData = () => {
        Promise.all([
          getFaucetInfo(),
          getAccountBalanceShare()
        ]).catch(e => {
            console.log("Error", e);

        })
    }

    const handleMaxButton = () => {
        let currentShared = parseTokenWithDecimals(accountBalanceShare, getTokenMetadata("VBIC").decimals);
        let maxSharePerAccount = parseTokenWithDecimals(faucetInfo.maxSharePerAccount, getTokenMetadata("VBIC").decimals)

        setFaucetValue(maxSharePerAccount - currentShared);
    }

    const isDisable = () => {
        let currentShared = parseTokenWithDecimals(accountBalanceShare, getTokenMetadata("VBIC").decimals);
        let maxSharePerAccount = parseTokenWithDecimals(faucetInfo.maxSharePerAccount, getTokenMetadata("VBIC").decimals);
        let totalBalance = parseTokenWithDecimals(faucetInfo.totalBalanceShare, getTokenMetadata("VBIC").decimals);

        return !wallet.isSignedIn() || !faucetValue || totalBalance == 0 || totalBalance <= faucetValue || currentShared == maxSharePerAccount || currentShared + faucetValue > maxSharePerAccount;
    }

    const handleFaucet = async () => {
        if (!wallet.isSignedIn()) await login();
        if (isDisable()) return;
        setFaucetLoading(true);
        try {
            // @ts-ignore
            await faucet(parseTokenAmount(faucetValue, getTokenMetadata("VBIC").decimals).toLocaleString('fullwide', {useGrouping:false}));
        } catch (e) {
            console.log("Error", e);
        } finally {
            setFaucetLoading(false);
        }
    }

    useEffect(() => {
        refreshData()
    }, [wallet.getAccountId(), wallet.isSignedIn()]);

    return (
      <div className="staking w-full">
          <section className="w-full md:w-560px lg:w-560px xl:w-560px m-auto relative xs:px-2">
              <div className="flex flex-row justify-between items-center">
                  <h1 className={"text-white text-3xl"}>
                      Faucet
                  </h1>
                  <IntervalSpinner onProgressSuccess={refreshData} />
              </div>
              <div className={"flex flex-col mt-5 justify-between"}>
                  <div className={"flex flex-row justify-between mb-2 bg-cardBg rounded-2xl p-5 w-full"}>
                      <p className={"text-base text-primaryText"}>Faucet Balance</p>
                      <p className={"text-2xl text-white"}>{formatNumber(parseTokenWithDecimals(faucetInfo.totalBalanceShare, getTokenMetadata("VBIC").decimals))} VBIC</p>
                  </div>
              </div>
              <div className={"bg-cardBg rounded-2xl p-5 mb-2"}>
                  <div className={"input-form mt-5"}>
                      <p className="flex flex-row items-center text-primaryText mb-2">
                          <CreditCardOutlined />
                          <span className="text-primaryText mr-2 ml-1">Shared balance:</span>
                          {formatNumber(parseTokenWithDecimals(accountBalanceShare, getTokenMetadata("VBIC").decimals))}
                          <img className="mr-1 ml-2" style={{width: 15, height: 15}} src={getTokenMetadata("VBIC").icon} alt=""/><span className="text-primary">VBIC</span>
                      </p>
                      <InputNumber min={0} className={"staking-input font-bold mb-4 rounded"} addonAfter={<MaxButton onClick={handleMaxButton} />} value={faucetValue} onChange={(value) => setFaucetValue(value)} defaultValue={0} />

                      <p className="text-xs text-primaryText mb-1">
                          {
                              accountBalanceShare == faucetInfo.maxSharePerAccount ?
                                <span>One account can get max {formatNumber(parseTokenWithDecimals(faucetInfo.maxSharePerAccount, getTokenMetadata("VBIC").decimals))} VBIC. You can not get more!</span>
                                :<span>One account can get max {formatNumber(parseTokenWithDecimals(faucetInfo.maxSharePerAccount, getTokenMetadata("VBIC").decimals))} VBIC. You can get more!</span>
                          }
                      </p>
                      <MyButton onClick={handleFaucet} loading={faucetLoading} disable={isDisable()} text="Claim token"/>
                  </div>
              </div>
              <div className="w-full grid mt-3 grid-cols-2 lg:grid-rows-2 gap-2">
                  <div
                    className="lg:h-16 xs:h-20 md:h-20 rounded-lg bg-darkGradientBg shadow-dark p-2.5 hover:bg-darkGradientHoverBg">
                      <div className="text-primaryText text-xs mb-1 xs:h-8 md:h-8 lg:text-center">
                          Number of Unique Accounts
                      </div>
                      <div className="lg:flex lg:justify-center lg:items-center">
                          <label className="text-base font-medium text-xREFColor">{faucetInfo.totalAccountShared}</label>
                          <label className="text-xs ml-1.5 text-primaryText">Accounts</label>
                      </div>
                  </div>
                  <div
                    className="lg:h-16 xs:h-20 md:h-20 rounded-lg bg-darkGradientBg shadow-dark p-2.5 hover:bg-darkGradientHoverBg">
                      <div className="text-primaryText text-xs mb-1 xs:h-8 md:h-8 lg:text-center">
                          Total VBIC Shared
                      </div>
                      <div className="lg:flex lg:justify-center lg:items-center">
                          <label className="text-base font-medium text-xREFColor">{formatNumber(parseTokenWithDecimals(faucetInfo.totalShared, getTokenMetadata("VBIC").decimals))}</label>
                          <label className="text-xs ml-1.5 text-primaryText">VBIC</label>
                      </div>
                  </div>
              </div>
          </section>
      </div>
    )
}

export default FaucetPage;