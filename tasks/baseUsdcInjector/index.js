const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const ethers = require('ethers')

const UPKEEP_ADDRESS = '0xA6E7840Fc8193cFeBDdf177fa410038E5DD08f7A'
const UPKEEP_ABI = `[{"inputs":[{"internalType":"uint256","name":"minWaitPeriodSeconds","type":"uint256"},{"internalType":"address","name":"keeperAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"OnlyKeeperRegistry","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ERC20Swept","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amountAdded","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"balance","type":"uint256"},{"indexed":false,"internalType":"address","name":"payee","type":"address"}],"name":"FundsAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":false,"internalType":"address","name":"newAddress","type":"address"}],"name":"KeeperAddressUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"}],"name":"gasTokenWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"minWaitSeconds","type":"uint256"}],"name":"minWaitPeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"pokeFailed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address[]","name":"gaugelist","type":"address[]"},{"indexed":false,"internalType":"uint256","name":"cost","type":"uint256"}],"name":"poked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"rateProviderAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"rateProviderAlreadyExists","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"rateProviderRemove","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"removeNonexistentRateProvider","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"address","name":"registry","type":"address"}],"name":"wrongCaller","type":"event"},{"inputs":[],"name":"KeeperAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"LastRun","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MinWaitPeriodSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"rateProvider","type":"address"}],"name":"addRateProvider","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"rateProviders","type":"address[]"}],"name":"addRateProviders","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"","type":"bytes"}],"name":"checkUpkeep","outputs":[{"internalType":"bool","name":"upkeepNeeded","type":"bool"},{"internalType":"bytes","name":"performData","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRateProviders","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"performData","type":"bytes"}],"name":"performUpkeep","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"rateProviders","type":"address[]"}],"name":"pokeList","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"rateProvider","type":"address"}],"name":"removeRateProvider","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"rateProviders","type":"address[]"}],"name":"removeRateProviders","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"keeperAddress","type":"address"}],"name":"setKeeperAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minWaitSeconds","type":"uint256"}],"name":"setMinWaitPeriodSeconds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"sweep","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawGasToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]`



// Entrypoint for the Autotask
exports.handler = async function (credentials, context) {
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fast' });
    const contract = new ethers.Contract(UPKEEP_ADDRESS, UPKEEP_ABI, signer);

    // checkUpkeep
    const { upkeepNeeded, performData } = await contract.connect(signer).checkUpkeep('0x');
    console.log('upkeepNeeded: ', upkeepNeeded);

    // performUpkeep
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
            const { notificationClient } = context;
            try {
                notificationClient.send({
                    channelAlias: '#defender-alerts',
                    subject: 'Upkeep performed',
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
    const { API_KEY: apiKey, API_SECRET: apiSecret } = process.env;
    exports.handler({ apiKey, apiSecret })
        .then(() => process.exit(0))
        .catch(error => { console.error(error); process.exit(1); });
}