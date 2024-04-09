const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const ethers = require('ethers')
const { KeyValueStoreClient } = require('@openzeppelin/defender-kvstore-client');
const {AutotaskClient} = require('@openzeppelin/defender-autotask-client')
const { BigNumber } = require('ethers');

const autotaskRetrySchedule = {
    type: 'schedule',
    frequencyMinutes: 5,
};
const autotaskScheduleTrigger = {
    type: 'schedule',
    cron: '5 0 * * 4',
};


// use a threshold of 100% in tests to avoid spending more than necessary
//const CHECKPOINTING_THRESHOLD = "1000000000000000000"
// if the current week is a multiple of 3, use a threshold of 0.01%; otherwise, 0.03%
const CHECKPOINTING_THRESHOLD = (Math.floor(new Date().getTime() / 1000 / 604800) % 3 == 0) ? 100000000000000 : 300000000000000;
const MAX_ETH_TO_BRIDGE = '0.1';
const GAUGE_CHECKPOINTER_ADDRESS = '0x0C8f71D19f87c0bD1b9baD2484EcC3388D5DbB98'
const GAUGE_CHECKPOINTER_ABI = `[{"inputs":[{"internalType":"contract IGaugeAdder","name":"gaugeAdder","type":"address"},{"internalType":"contract IAuthorizerAdaptorEntrypoint","name":"authorizerAdaptorEntrypoint","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"contract IStakelessGauge","name":"gauge","type":"address"},{"indexed":true,"internalType":"string","name":"indexedGaugeType","type":"string"},{"indexed":false,"internalType":"string","name":"gaugeType","type":"string"}],"name":"GaugeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"contract IStakelessGauge","name":"gauge","type":"address"},{"indexed":true,"internalType":"string","name":"indexedGaugeType","type":"string"},{"indexed":false,"internalType":"string","name":"gaugeType","type":"string"}],"name":"GaugeRemoved","type":"event"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"addGauges","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"addGaugesWithVerifiedType","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"checkpointAllGaugesAboveRelativeWeight","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string[]","name":"gaugeTypes","type":"string[]"},{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"checkpointGaugesOfTypesAboveRelativeWeight","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string[]","name":"gaugeTypes","type":"string[]"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"checkpointMultipleGauges","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"checkpointMultipleGaugesOfMatchingType","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge","name":"gauge","type":"address"}],"name":"checkpointSingleGauge","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"selector","type":"bytes4"}],"name":"getActionId","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAuthorizer","outputs":[{"internalType":"contract IAuthorizer","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getGaugeAdder","outputs":[{"internalType":"contract IGaugeAdder","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getGaugeAtIndex","outputs":[{"internalType":"contract IStakelessGauge","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getGaugeTypes","outputs":[{"internalType":"string[]","name":"","type":"string[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string[]","name":"gaugeTypes","type":"string[]"},{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"getGaugeTypesBridgeCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getRoundedDownBlockTimestamp","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge","name":"gauge","type":"address"}],"name":"getSingleBridgeCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"getTotalBridgeCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"}],"name":"getTotalGauges","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getVault","outputs":[{"internalType":"contract IVault","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge","name":"gauge","type":"address"}],"name":"hasGauge","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"}],"name":"isValidGaugeType","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"removeGauges","outputs":[],"stateMutability":"nonpayable","type":"function"}]`

// function to send notifications
async function sendNotification(context, _subject, _message) {
    const { notificationClient } = context;
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

// Entrypoint for the Autotask
exports.handler = async function (credentials, context) {
    const autotaskClient = new AutotaskClient({ apiKey: credentials.secrets.apiKey, apiSecret: credentials.secrets.apiSecret });
    let autotaskMetadata = await autotaskClient.get(credentials.autotaskId);
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, { speed: 'average' });
    const checkpointerContract = new ethers.Contract(GAUGE_CHECKPOINTER_ADDRESS, GAUGE_CHECKPOINTER_ABI, signer);
    console.log('Checkpointing threshold: ', CHECKPOINTING_THRESHOLD, ' = ', ethers.utils.formatEther(CHECKPOINTING_THRESHOLD) * 100, '%');

    const checkpointingTypes = [
        'Polygon',
        'Base',
        'Gnosis',
        'PolygonZkEvm',
        'EthereumSingleRecipientGauge',
        'Avalanche',
        'Arbitrum',
        'Optimism'
    ]
    const store = new KeyValueStoreClient(credentials);

    // checkpoint gauges of each type
    for (let i = 0; i < checkpointingTypes.length; i++) {
        const typesToCheckpoint = [checkpointingTypes[i]];
        // check if gauges of this type have already been checkpointed
        const checkpointed = await store.get(typesToCheckpoint[0]);
        if (checkpointed == 'true') {
            console.log('Already checkpointed gauges of type: ', typesToCheckpoint);
            continue;
        }

        // get bridge cost and gas estimate
        console.log('Checkpointing gauges of types: ', typesToCheckpoint);
        const bridgeCost = await checkpointerContract.callStatic.getGaugeTypesBridgeCost(typesToCheckpoint, CHECKPOINTING_THRESHOLD);
        console.log('Bridge cost: ', bridgeCost.toString(), ' = ', ethers.utils.formatEther(bridgeCost), ' ETH');
        let gasEstimate = 0;
        let checkpointingThresholdMultiplier = 1;
        try {
            gasEstimate = await checkpointerContract.estimateGas.checkpointGaugesOfTypesAboveRelativeWeight(typesToCheckpoint, BigNumber.from(CHECKPOINTING_THRESHOLD).mul(checkpointingThresholdMultiplier), {value: bridgeCost});
        } catch (error) {
            console.log('Failed to estimate gas cost of checkpointing gauges of types: ', typesToCheckpoint, error);
            checkpointingThresholdMultiplier = 3;
            console.log('Trying a higher threshold:', BigNumber.from(CHECKPOINTING_THRESHOLD).mul(checkpointingThresholdMultiplier));
            gasEstimate = await checkpointerContract.estimateGas.checkpointGaugesOfTypesAboveRelativeWeight(typesToCheckpoint, BigNumber.from(CHECKPOINTING_THRESHOLD).mul(checkpointingThresholdMultiplier), {value: bridgeCost});
        }
        console.log('Gas estimate: ', gasEstimate.toString());

        // increase gas limit by 10% to avoid out-of-gas errors
        const gasLimit = Math.floor(gasEstimate * 1.1);
        console.log('Gas limit set to: ', gasLimit.toString());


        try {
            // checkpoint gauges; if successful, notify and store checkpointed type in KV store
            const tx = await checkpointerContract.connect(signer).checkpointGaugesOfTypesAboveRelativeWeight(typesToCheckpoint, BigNumber.from(CHECKPOINTING_THRESHOLD).mul(checkpointingThresholdMultiplier), {gasLimit: gasLimit, value: bridgeCost});
            console.log(tx);
            if (checkpointingThresholdMultiplier == 1) {
                sendNotification(
                    context,
                    typesToCheckpoint + ' root gauges checkpointed',
                    'Transaction hash: ' + tx.hash + '; threshold: ' + BigNumber.from(CHECKPOINTING_THRESHOLD).mul(checkpointingThresholdMultiplier));
                await store.put(typesToCheckpoint[0], 'true');
            } else {
                sendNotification(
                    context,
                    typesToCheckpoint + ' root gauges partially checkpointed',
                    'Transaction hash: ' + tx.hash + '; threshold: ' + BigNumber.from(CHECKPOINTING_THRESHOLD).mul(checkpointingThresholdMultiplier));
                await store.put(typesToCheckpoint[0], 'false');
            }
        } catch (error) {
            // if checkpointing fails, notify and exit
            console.error('Failed to checkpoint gauges of types: ', typesToCheckpoint, error);
            sendNotification(
                context,
                'Failed to checkpoint gauges of types: ' + typesToCheckpoint,
                error.message);
            await store.put(typesToCheckpoint[0], 'false');
        }
    }

    // wait 10 seconds before sending the final notification for this round just so it is the last notification
    await new Promise(resolve => setTimeout(resolve, 10000));

    // check that all types have been checkpointed
    let allCheckpointed = true;
    for (let i = 0; i < checkpointingTypes.length; i++) {
        if (await store.get(checkpointingTypes[i]) != 'true') {
            allCheckpointed = false;
            autotaskMetadata.trigger = autotaskRetrySchedule;
            await autotaskClient.update(autotaskMetadata);
            console.error('Not all types have been checkpointed');
            sendNotification(
                context,
                'Checkpointer failed to checkpoint all types',
                'Autotask will retry in 5 minutes');
            break;
        }
    }
    // if all types have been checkpointed, reset all checkpointing control flags and schedule next checkpointing
    if (allCheckpointed) {
        for (let i = 0; i < checkpointingTypes.length; i++) {
            await store.put(checkpointingTypes[i], 'false');
        }

        autotaskMetadata.trigger = autotaskScheduleTrigger;
        await autotaskClient.update(autotaskMetadata);
        console.log('Autotask will run again next Thursday at 00:05 UTC');
        sendNotification(
            context,
            'Checkpointed all types',
            'Autotask will run again next Thursday at 00:05 UTC');
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