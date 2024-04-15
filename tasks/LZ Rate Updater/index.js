const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const ethers = require('ethers')
const {AutotaskClient} = require('@openzeppelin/defender-autotask-client')

const LZ_RATE_PROVIDER__ABI = `[{"inputs":[{"internalType":"uint16","name":"_dstChainId","type":"uint16"},{"internalType":"address","name":"_layerZeroEndpoint","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"newDstChainId","type":"uint16"}],"name":"DstChainIdUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newLayerZeroEndpoint","type":"address"}],"name":"LayerZeroEndpointUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newRateReceiver","type":"address"}],"name":"RateReceiverUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newRate","type":"uint256"}],"name":"RateUpdated","type":"event"},{"inputs":[],"name":"dstChainId","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLatestRate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastUpdated","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"layerZeroEndpoint","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rateInfo","outputs":[{"internalType":"string","name":"tokenSymbol","type":"string"},{"internalType":"address","name":"tokenAddress","type":"address"},{"internalType":"string","name":"baseTokenSymbol","type":"string"},{"internalType":"address","name":"baseTokenAddress","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"rateReceiver","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"_dstChainId","type":"uint16"}],"name":"updateDstChainId","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_layerZeroEndpoint","type":"address"}],"name":"updateLayerZeroEndpoint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"updateRate","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_rateReceiver","type":"address"}],"name":"updateRateReceiver","outputs":[],"stateMutability":"nonpayable","type":"function"}]`

const LOWER_GAS_PRICE = 16_000_000_000
const UPPER_GAS_PRICE = 100_000_000_000
const ABSOLUTE_MAX_GAS_PRICE = 999_000_000_000
const MAX_DELAY = 60 * 60 * 48 // 48 hours
const RATE_PROVIDERS = ['0xB385BBc8Bfc80451cDbB6acfFE4D95671f4C051c', '0xaD78CD17D3A4a3dc6afb203ef91C0E54433b3b9d']

const autotaskRetrySchedule = {
    type: 'schedule',
    frequencyMinutes: 30,
};

const getCronScheduleForTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();
    const dayOfMonth = date.getUTCDate();
    const month = date.getUTCMonth() + 1;

    const cron = `${minutes} ${hours} ${dayOfMonth} ${month} *`;

    return {
        type: 'schedule',
        cron: cron,
    };
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
    const autotaskClient = new AutotaskClient({
        apiKey: credentials.secrets.DEFENDER_API_KEY,
        apiSecret: credentials.secrets.DEFENDER_API_SECRET
    });
    let autotaskMetadata = await autotaskClient.get(credentials.autotaskId);
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {speed: 'fast'});


    let shouldScheduleTomorrow = true;

    for (let rateProvider of RATE_PROVIDERS) {
        const contract = new ethers.Contract(rateProvider, LZ_RATE_PROVIDER__ABI, signer);

        const lastRun = await contract.connect(signer).lastUpdated();
        console.log("Last run: ", lastRun.toString())
        const deltaT = Date.now() / 1000 - lastRun;
        // calculate the delay in poking the rate provider considering we can only poke after 24 hours
        const delay = deltaT - 60 * 60 * 24;
        console.log("Delay: ", delay.toString());

        if (delay < 0) {
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
                console.log('Autotask will run again next Tomorrow at 10:25 UTC');
            } else {
                console.log('No context, not sending notification');
                console.log('Rate updated: ' + tx.hash);
            }
        } else {
            shouldScheduleTomorrow = false;
            // await sendNotification(context, 'LZ Rate Updater: Gas too high', 'Autotask will retry in 30 minutes. GasPrice: ' + gasPrice + '. Willing to pay: ' + maxGasPrice)
            console.log('Gas too high, current delay is ', delay / 3600, ' hours, willing to pay max ', ethers.utils.formatUnits(maxGasPrice, 'gwei'));
        }
    }

    if (shouldScheduleTomorrow) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const tomorrowSchedule = nowInSeconds + 87000;
        autotaskMetadata.trigger = getCronScheduleForTimestamp(tomorrowSchedule);
    } else {
        autotaskMetadata.trigger = autotaskRetrySchedule;
    }
    await autotaskClient.update(autotaskMetadata);
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
    const credentials = {
        autotaskId: "06306db9-3616-4c71-a223-952a1b6bb5a5",
        apiKey: DEFENDER_API_KEY,
        apiSecret: DEFENDER_API_SECRET
    };
    credentials.secrets = {DEFENDER_API_KEY, DEFENDER_API_SECRET}
    exports.handler(credentials)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}