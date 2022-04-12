import React from "react";
import {Avatar, Modal} from "antd";
import {getTokenMetadata, tokenList, TokenMetadata} from "~utils/token";

const SelectTokenModal = (props: any) => {
    return (
      <Modal wrapClassName={"select-token-wrap"} centered width={400} className="bg-cardBg rounded-2xl" style={{background: "rgb(29, 41, 50)"}} visible={props.isModalVisible} footer={false} onCancel={props.onCancel}>
          <div className={"w-full h-80 rounded-3xl "} style={{background: "rgb(29, 41, 50)"}}>
              <h1 className="font-bold text-lg">Select Token</h1>
              <div className="mt-10 flex flex-wrap items-center">
                  {
                      tokenList.filter(item => item.symbol != props.ignoreToken.symbol).map((item: TokenMetadata) => (
                        <div onClick={() => props.onSelectToken(item)} key={item.symbol} className="w-1/3 mt-3 hover:bg-black hover:bg-opacity-10 rounded-full pr-3 pl-1 py-1 cursor-pointer flex items-center" style={{height: 36}}>
                            <img src={item.icon} alt="wNEAR" className="inline-block mr-2 border rounded-full border-greenLight" style={{width: 25, height: 25}} />
                            <span className="text-white">
                          <div style={{position: "relative", top: 2}}>{item.symbol}</div>
                          <span style={{position: "relative", bottom: 2}}>
                              <span className="text-xs text-primaryText">$0</span>
                          </span>
                      </span>
                        </div>
                      ))
                  }
              </div>
          </div>
      </Modal>
    )
}

export default SelectTokenModal;