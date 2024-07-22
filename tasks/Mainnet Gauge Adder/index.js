const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const ethers = require('ethers')

const GAUGE_CHECKPOINTER_ADDRESS = '0x0C8f71D19f87c0bD1b9baD2484EcC3388D5DbB98'
const GAUGE_CHECKPOINTER_ABI = `[{"inputs":[{"internalType":"contract IGaugeAdder","name":"gaugeAdder","type":"address"},{"internalType":"contract IAuthorizerAdaptorEntrypoint","name":"authorizerAdaptorEntrypoint","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"contract IStakelessGauge","name":"gauge","type":"address"},{"indexed":true,"internalType":"string","name":"indexedGaugeType","type":"string"},{"indexed":false,"internalType":"string","name":"gaugeType","type":"string"}],"name":"GaugeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"contract IStakelessGauge","name":"gauge","type":"address"},{"indexed":true,"internalType":"string","name":"indexedGaugeType","type":"string"},{"indexed":false,"internalType":"string","name":"gaugeType","type":"string"}],"name":"GaugeRemoved","type":"event"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"addGauges","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"addGaugesWithVerifiedType","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"checkpointGaugesAboveRelativeWeight","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"checkpointGaugesOfTypeAboveRelativeWeight","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"address","name":"gauge","type":"address"}],"name":"checkpointSingleGauge","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"selector","type":"bytes4"}],"name":"getActionId","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAuthorizer","outputs":[{"internalType":"contract IAuthorizer","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getGaugeAdder","outputs":[{"internalType":"contract IGaugeAdder","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getGaugeAtIndex","outputs":[{"internalType":"contract IStakelessGauge","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"address","name":"gauge","type":"address"}],"name":"getSingleBridgeCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"getTotalBridgeCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"}],"name":"getTotalGauges","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getVault","outputs":[{"internalType":"contract IVault","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge","name":"gauge","type":"address"}],"name":"hasGauge","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"}],"name":"isValidGaugeType","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"removeGauges","outputs":[],"stateMutability":"nonpayable","type":"function"}]`
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/75376/balancer-gauges/version/latest'
const SUBGRAPH_QUERY = `{
    rootGauges (first:1000 where:{
      isKilled:false
      gauge_not:null
    }) {
      id
      chain
    }
     singleRecipientGauges(first: 100, where:{
      isKilled:false
      gauge_not:null
    }) {
    id
  }
  }`

async function getGauges() {
    const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({query: SUBGRAPH_QUERY}),
    })
    const json = await response.json()
    let rootGauges = json.data.rootGauges;
    let singleRecipientGauges = json.data.singleRecipientGauges;
    singleRecipientGauges.forEach(obj => obj.chain = "EthereumSingleRecipientGauge");

    return [...rootGauges, ...singleRecipientGauges]
}

exports.handler = async function (event, context) {
    try {
        console.log('Getting gauges from the subgraph...');
        const gauges = await getGauges();

        const provider = new DefenderRelayProvider(event);
        const signer = new DefenderRelaySigner(event, provider, {speed: 'fast'});
        const checkpointerContract = new ethers.Contract(GAUGE_CHECKPOINTER_ADDRESS, GAUGE_CHECKPOINTER_ABI, signer);

        const chains = [...new Set(gauges.map(gauge => gauge.chain))];

        for (let i = 0; i < chains.length; i++) {
            const chain = chains[i];
            console.log('Adding gauges for chain ', chain);
            const gaugesForChain = gauges.filter(gauge => gauge.chain === chain);

            let gaugesToAdd = [];
            for (let j = 0; j < gaugesForChain.length; j++) {
                const gaugeAddress = gaugesForChain[j].id;
                const gaugeType = gaugesForChain[j].chain;

                const gaugeExists = await checkpointerContract.connect(signer).hasGauge(gaugeType, gaugeAddress);
                if (!gaugeExists) {
                    gaugesToAdd.push(gaugeAddress);
                }
            }

            if (gaugesToAdd.length > 0) {
                console.log('Adding gauges ', gaugesToAdd, ' of type ', chain, ' to the checkpointer contract');
                const tx = await checkpointerContract.connect(signer).addGauges(chain, gaugesToAdd);
                console.log(tx);
            } else {
                console.log('No gauges to add for chain ', chain);
            }
        }

        console.log('Gauge checkpointer script completed successfully.');
    } catch (error) {
        console.error('An error occurred in the gauge checkpointer script:', error);

        if (context) {
            const { notificationClient } = context;
            try {
                notificationClient.send({
                    channelAlias: 'maxi_alerts_critical',
                    subject: 'MAINNET GAUGE ADDER FAILED',
                    message: 'There was a problem running the Mainnet Gauge Adder on Open Zeppelin. ' + error
                });
            } catch (error) {
                console.error('Failed to send notification', error);
            }
        } else {
            console.log('No context, not sending notification');
        }

        // Re-throw the error to ensure the task is marked as failed
        throw error;
    }
}

if (require.main === module) {
    require('dotenv').config();
    const {DEFENDER_API_KEY: apiKey, DEFENDER_API_SECRET: apiSecret} = process.env;
    exports.handler({apiKey, apiSecret})
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}