function getConfig(env: string) {
    switch (env) {
        case 'production':
        case 'mainnet':
            return {
                networkId: 'mainnet',
                nodeUrl: 'https://rpc.mainnet.near.org',
                walletUrl: 'https://wallet.near.org',
                helperUrl: 'https://helper.mainnet.near.org',
                explorerUrl: 'https://explorer.mainnet.near.org',
                VBI_STAKING_CONTRACT: "staking.vbidev.near",
                VBI_FT_CONTRACT: "ft.vbidev.near",
                VBI_FAUCET_FT_CONTRACT: "faucet-vbic.vbidev.near"
            }
        case 'development':
        case 'testnet':
            return {
                networkId: 'testnet',
                nodeUrl: 'https://rpc.testnet.near.org',
                walletUrl: 'https://wallet.testnet.near.org',
                helperUrl: 'https://helper.testnet.near.org',
                explorerUrl: 'https://explorer.testnet.near.org',
                VBI_STAKING_CONTRACT: "staking.vbidev.testnet",
                VBI_FT_CONTRACT: "ft.vbidev.testnet",
                VBI_FAUCET_FT_CONTRACT: "faucet-vbic.vbidev.testnet"
            }
        default:
            throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
    }
}

export default getConfig;