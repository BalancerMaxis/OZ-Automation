const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const ethers = require('ethers')
const {AutoTaskClient} = require('@openzeppelin/defender-autotask-client')
const {AutotaskClient} = require("defender-autotask-client");

const LZ_RATE_PROVIDER_POKER_ADDRESS = '0xdDd5FF0E581f097573B13f247F6BE736f602F839'
const LZ_RATE_PROVIDER_POKER_ABI = `[{"inputs":[{"internalType":"uint256","name":"minWaitPeriodSeconds","type":"uint256"},{"internalType":"address","name":"keeperAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"OnlyKeeperRegistry","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"ERC20Swept","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amountAdded","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"balance","type":"uint256"},{"indexed":false,"internalType":"address","name":"payee","type":"address"}],"name":"FundsAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oldAddress","type":"address"},{"indexed":false,"internalType":"address","name":"newAddress","type":"address"}],"name":"KeeperAddressUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferRequested","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"address","name":"recipient","type":"address"}],"name":"gasTokenWithdrawn","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"minWaitSeconds","type":"uint256"}],"name":"minWaitPeriodUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"pokeFailed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address[]","name":"gaugelist","type":"address[]"},{"indexed":false,"internalType":"uint256","name":"cost","type":"uint256"}],"name":"poked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"rateProviderAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"rateProviderAlreadyExists","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"rateProviderRemove","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"rateProvider","type":"address"}],"name":"removeNonexistentRateProvider","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"address","name":"registry","type":"address"}],"name":"wrongCaller","type":"event"},{"inputs":[],"name":"KeeperAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"LastRun","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MinWaitPeriodSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"rateProvider","type":"address"}],"name":"addRateProvider","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"rateProviders","type":"address[]"}],"name":"addRateProviders","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"","type":"bytes"}],"name":"checkUpkeep","outputs":[{"internalType":"bool","name":"upkeepNeeded","type":"bool"},{"internalType":"bytes","name":"performData","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRateProviders","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"performData","type":"bytes"}],"name":"performUpkeep","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"rateProviders","type":"address[]"}],"name":"pokeList","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"rateProvider","type":"address"}],"name":"removeRateProvider","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"rateProviders","type":"address[]"}],"name":"removeRateProviders","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"keeperAddress","type":"address"}],"name":"setKeeperAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minWaitSeconds","type":"uint256"}],"name":"setMinWaitPeriodSeconds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"sweep","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawGasToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]`

const LOWER_GAS_PRICE = 15_000_000_000
const UPPER_GAS_PRICE = 100_000_000_000
const ABSOLUTE_MAX_GAS_PRICE = 999_000_000_000
const MAX_DELAY = 60 * 60 * 48 // 48 hours
const RATE_PROVIDERS = ['0xB385BBc8Bfc80451cDbB6acfFE4D95671f4C051c', '0xaD78CD17D3A4a3dc6afb203ef91C0E54433b3b9d']

const autotaskRetrySchedule = {
    type: 'schedule',
    frequencyMinutes: 5,
};

const autotaskScheduleTrigger = {
    type: 'schedule',
    cron: '26 10 * * *',
};

// aux function to get the max amount of gas we are willing to pay given the delay in poking the relayer
function getMaxGasPrice(delay) {
    if (delay < 0) {
        return 0;
    } else if (delay > MAX_DELAY) {
        return ABSOLUTE_MAX_GAS_PRICE;
    } else {
        const gasPrice = LOWER_GAS_PRICE + (UPPER_GAS_PRICE - LOWER_GAS_PRICE) * (delay / MAX_DELAY);
        // return the integer part of the gas price
        return Math.floor(gasPrice);
    }
}

// Entrypoint for the Autotask
exports.handler = async function (credentials, context) {
    console.log(credentials)
    const autotaskClient = new AutoTaskClient({
        apiKey: credentials.secrets.DEFENDER_API_KEY,
        apiSecret: credentials.secrets.DEFENDER_API_SECRET
    });
    let autotaskMetadata = await autotaskClient.get(credentials.autotaskId);
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {speed: 'fast'});

    for (let rateProvider of RATE_PROVIDERS) {
        const contract = new ethers.Contract(rateProvider, LZ_RATE_PROVIDER_POKER_ABI, signer);

        const lastRun = await contract.connect(signer).lastUpdated();
        const deltaT = Date.now() / 1000 - lastRun;
        // calculate the delay in poking the relayer considering we can only poke after 24 hours
        const delay = deltaT - 60 * 60 * 24;

        if (delay < 0) {
            autotaskMetadata.trigger = autotaskRetrySchedule;
            await autotaskClient.update(autotaskMetadata);
            continue;
        }

        // get the gas price from the network
        const gasPrice = await signer.getGasPrice();
        const maxGasPrice = getMaxGasPrice(delay);
        console.log('Gas price: ', ethers.utils.formatUnits(gasPrice, 'gwei'));
        console.log('Max gas price: ', ethers.utils.formatUnits(maxGasPrice, 'gwei'));

        if (gasPrice < maxGasPrice) {
            // estimate the gas cost of performing the upkeep
            const gasEstimate = await contract.estimateGas.updateRate({value: ethers.utils.parseUnits("0.01")});
            console.log('Gas estimate: ', gasEstimate.toString());
            const gasLimit = Math.floor(gasEstimate * 1.2);
            console.log('Gas limit set to: ', gasLimit.toString());

            console.log('Updating rate...');
            const tx = await contract.connect(signer).updateRate({
                value: ethers.utils.parseUnits("0.01"),
                gasLimit: gasLimit
            });
            console.log(tx);

            if (context) {
                await sendNotification(context, 'Rate updated for: ' + rateProvider, 'Transaction hash: ' + tx.hash)
                autotaskMetadata.trigger = autotaskScheduleTrigger;
                await autotaskClient.update(autotaskMetadata);
                console.log('Autotask will run again next Tomorrow at 10:25 UTC');
            } else {
                console.log('No context, not sending notification');
                console.log('Rate updated: ' + tx.hash);
            }
        } else {
            autotaskMetadata.trigger = autotaskRetrySchedule;
            await autotaskClient.update(autotaskMetadata);
            await sendNotification(context, 'LZ Rate Updater: Gas too high', 'Autotask will retry in 5 minutes')
            console.log('Gas too high, current delay is ', delay / 3600, ' hours, willing to pay max ', ethers.utils.formatUnits(maxGasPrice, 'gwei'));
        }
    }
}

async function sendNotification(context, _subject, _message) {
    const {notificationClient} = context;
    try {
        notificationClient.send({
            channelAlias: 'Hal Maxi Bot (tg)',
            subject: _subject,
            message: _message
        });
    } catch (error) {
        console.error('Failed to send notification', error);
    }
}

// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {
    require('dotenv').config();
    const {DEFENDER_API_KEY: DEFENDER_API_KEY, DEFENDER_API_SECRET: DEFENDER_API_SECRET} = process.env;
    exports.handler({DEFENDER_API_KEY, DEFENDER_API_SECRET})
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}