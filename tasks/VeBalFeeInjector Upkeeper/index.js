const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const ethers = require('ethers')


const UPKEEPER_ADDRESS = '0x8AD2512819A7eae1dd398973EFfaE48dafBe8255'
const UPKEEP_ABI = `[{"inputs":[{"internalType":"address","name":"_keeperRegistry","type":"address"},{"internalType":"address","name":"_feeDistributor","type":"address"},{"internalType":"contract IERC20[]","name":"_tokens","type":"address[]"},{"internalType":"uint256","name":"minAmount","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"payee","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ERC20Swept","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract IERC20[]","name":"tokens","type":"address[]"},{"indexed":false,"internalType":"uint256[]","name":"amounts","type":"uint256[]"},{"indexed":false,"internalType":"uint256","name":"timeCurser","type":"uint256"},{"indexed":false,"internalType":"bool","name":"half","type":"bool"}],"name":"FeesPaid","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"newHalf","type":"bool"}],"name":"HalfFlipped","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":false,"internalType":"address","name":"newAddress","type":"address"}],"name":"KeeperRegistryUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"minAmount","type":"uint256"}],"name":"MinAmountSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract IERC20[]","name":"tokens","type":"address[]"}],"name":"TokensSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[],"name":"FeeDistributor","outputs":[{"internalType":"contract IFeeDistributor","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"Half","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"KeeperRegistry","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"LastRunTimeCurser","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"ManagedTokens","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MinAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"","type":"bytes"}],"name":"checkUpkeep","outputs":[{"internalType":"bool","name":"upkeepNeeded","type":"bool"},{"internalType":"bytes","name":"performData","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"flipHalf","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getTokens","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"payFees","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"performData","type":"bytes"}],"name":"performUpkeep","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_keeperRegistry","type":"address"}],"name":"setKeeperRegistry","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minAmount","type":"uint256"}],"name":"setMinAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC20[]","name":"tokens","type":"address[]"}],"name":"setTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"address","name":"payee","type":"address"}],"name":"sweep","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"address payable","name":"payee","type":"address"}],"name":"withdraw","outputs":[],"stateMutability":"nonpayable","type":"function"}]`


// Entrypoint for the Autotask
exports.handler = async function (credentials, context) {
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {speed: 'fast'});

    // checkUpkeep
    const contract = new ethers.Contract(UPKEEPER_ADDRESS, UPKEEP_ABI, signer);
    console.log(`Checking VeBalFeeInjector: ${UPKEEPER_ADDRESS}`);
    const {upkeepNeeded, performData} = await contract.connect(signer).checkUpkeep('0x');
    console.log('upkeepNeeded: ', upkeepNeeded);

    if (upkeepNeeded) {
        // get the gas price from the network
        const gasPrice = await signer.getGasPrice();
        console.log('Gas price: ', ethers.utils.formatUnits(gasPrice, 'gwei'));

        // estimate the gas cost of performing the upkeep
        const gasEstimate = await contract.estimateGas.performUpkeep(performData);
        console.log('Gas estimate: ', gasEstimate.toString());
        const gasLimit = Math.floor(gasEstimate * 1.2);
        console.log('Gas limit set to: ', gasLimit.toString());

        console.log('Performing upkeep');
        const tx = await contract.connect(signer).performUpkeep(performData, {gasLimit: gasLimit});
        console.log(tx);

        if (context) {
            const {notificationClient} = context;
            try {
                notificationClient.send({
                    channelAlias: 'Hal Maxi Bot (tg)',
                    subject: 'VeBalFeeInjector Upkeep performed',
                    message: 'Transaction hash: ' + tx.hash
                });
            } catch (error) {
                console.error('Failed to send notification', error);
            }
        } else {
            console.log('No context, not sending notification');
            console.log('Upkeep performed: ' + tx.hash);
        }

    }


}


// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {
    require('dotenv').config();
    const {RELAYER_API_KEY: apiKey, RELAYER_API_SECRET: apiSecret} = process.env;
    console.log(apiKey)
    exports.handler({apiKey, apiSecret})
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}