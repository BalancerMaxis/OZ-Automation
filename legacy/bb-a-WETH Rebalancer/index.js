const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const ethers = require('ethers')

const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2'
const SUBGRAPH_QUERY = `{
    pool(id:"0x60d604890feaa0b5460b28a424407c24fe89374a0000000000000000000004fc") {
      id
      symbol
      swapFee
      lowerTarget
      upperTarget
      mainIndex
      tokensList
      tokens {
        address
        balance
        assetManager
      }
    }
  }`

// aux function to get all gauges from subgraph
async function getPoolData() {
    const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: SUBGRAPH_QUERY }),
    })
    const json = await response.json()
    let result = json.data.pool
    return result
}



const BB_A_WETH_REBALANCER_ADDRESS = '0x9c2fC986b718121bB2DE314351A77681a89b24C2'
const REBALANCER_ABI = `[{"inputs":[{"internalType":"contract IVault","name":"vault","type":"address"},{"internalType":"contract IBalancerQueries","name":"queries","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"getPool","outputs":[{"internalType":"contract ILinearPool","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"}],"name":"rebalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"extraMain","type":"uint256"}],"name":"rebalanceWithExtraMain","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"}]`

// Entrypoint for the Autotask
exports.handler = async function (credentials, context) {
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
    const rebalancerContract = new ethers.Contract(BB_A_WETH_REBALANCER_ADDRESS, REBALANCER_ABI, signer);

    const poolData = await getPoolData();
    console.log(poolData);

    const mainTokenIndex = poolData.mainIndex;
    console.log('Main token index: ', mainTokenIndex);

    const mainToken = poolData.tokens[mainTokenIndex];
    console.log('Main token: ', mainToken);

    // find the main token in the tokens attribute of the pool, based on the address
    const mainTokenInPool = poolData.tokens.find(token => token.address === mainToken.address);
    const mainTokenBalance = mainTokenInPool.balance;
    console.log('Main token balance: ', mainTokenBalance);

    // calculate how much can be made by rebalancing the pool
    // start by converting the values to numbers
    const mainTokenBalanceNumber = Number(mainTokenBalance);
    const lowerTargetNumber = Number(poolData.lowerTarget);
    const upperTargetNumber = Number(poolData.upperTarget);
    const swapFeeNumber = Number(poolData.swapFee);
    // calculate the value
    let value = 0;
    if (mainTokenBalanceNumber > upperTargetNumber) {
        value = (mainTokenBalanceNumber - upperTargetNumber) * swapFeeNumber;
    }
    if (mainTokenBalanceNumber < lowerTargetNumber) {
        value = (lowerTargetNumber - mainTokenBalanceNumber) * swapFeeNumber;
    }
    console.log('Rebalance value: ', value);
    if (value > 0) {
        // estimate the gas cost of calling the rebalance function
        const gasEstimate = await rebalancerContract.estimateGas.rebalance(signer.getAddress());
        console.log('Gas estimate: ', gasEstimate.toString());

        // get the gas price from the network
        const gasPrice = await signer.getGasPrice();
        console.log('Gas price: ', ethers.utils.formatUnits(gasPrice, 'gwei'));

        // calculate the cost of the transaction
        const cost = gasEstimate.mul(gasPrice);
        console.log('Cost: ', ethers.utils.formatEther(cost));
        const costScaledNumber = Number(ethers.utils.formatEther(cost));

        if (value > costScaledNumber) {
            console.log('Rebalancing profitable');
            const tx = await rebalancerContract.connect(signer).rebalance(signer.getAddress());
            console.log(tx);

            const { notificationClient } = context;
            try {
                notificationClient.send({
                    channelAlias: '#defender-alerts',
                    subject: 'Mainnet bb-a-weth rebalance triggered',
                    message: 'Transaction hash: ' + tx.hash
                });
            } catch (error) {
                console.error('Failed to send notification', error);
            }


        } else {
            console.log('Rebalancing not profitable');
        }
    } else {
        console.log('Rebalancing not profitable');
    }
}