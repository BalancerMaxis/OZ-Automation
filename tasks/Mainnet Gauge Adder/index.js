const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const {Relayer} = require('defender-relay-client');
const ethers = require('ethers')

const GAUGE_CHECKPOINTER_ADDRESS = '0x0C8f71D19f87c0bD1b9baD2484EcC3388D5DbB98'
const GAUGE_CHECKPOINTER_ABI = `[{"inputs":[{"internalType":"contract IGaugeAdder","name":"gaugeAdder","type":"address"},{"internalType":"contract IAuthorizerAdaptorEntrypoint","name":"authorizerAdaptorEntrypoint","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"contract IStakelessGauge","name":"gauge","type":"address"},{"indexed":true,"internalType":"string","name":"indexedGaugeType","type":"string"},{"indexed":false,"internalType":"string","name":"gaugeType","type":"string"}],"name":"GaugeAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"contract IStakelessGauge","name":"gauge","type":"address"},{"indexed":true,"internalType":"string","name":"indexedGaugeType","type":"string"},{"indexed":false,"internalType":"string","name":"gaugeType","type":"string"}],"name":"GaugeRemoved","type":"event"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"addGauges","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"addGaugesWithVerifiedType","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"checkpointGaugesAboveRelativeWeight","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"checkpointGaugesOfTypeAboveRelativeWeight","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"address","name":"gauge","type":"address"}],"name":"checkpointSingleGauge","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"selector","type":"bytes4"}],"name":"getActionId","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAuthorizer","outputs":[{"internalType":"contract IAuthorizer","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getGaugeAdder","outputs":[{"internalType":"contract IGaugeAdder","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getGaugeAtIndex","outputs":[{"internalType":"contract IStakelessGauge","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"address","name":"gauge","type":"address"}],"name":"getSingleBridgeCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"minRelativeWeight","type":"uint256"}],"name":"getTotalBridgeCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"}],"name":"getTotalGauges","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getVault","outputs":[{"internalType":"contract IVault","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge","name":"gauge","type":"address"}],"name":"hasGauge","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"}],"name":"isValidGaugeType","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"gaugeType","type":"string"},{"internalType":"contract IStakelessGauge[]","name":"gauges","type":"address[]"}],"name":"removeGauges","outputs":[],"stateMutability":"nonpayable","type":"function"}]`
const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges'
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

// aux function to get all gauges from subgraph
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


// Entrypoint for the Autotask
exports.handler = async function (event) {
    const relayer = new Relayer(event);
    // Use relayer for sending txs
    console.log('Getting gauges from the subgraph...');
    const gauges = await getGauges();

    const provider = new DefenderRelayProvider(event);
    const signer = new DefenderRelaySigner(event, provider, {speed: 'fast'});
    const checkpointerContract = new ethers.Contract(GAUGE_CHECKPOINTER_ADDRESS, GAUGE_CHECKPOINTER_ABI, signer);
    // get the unique chains
    const chains = [...new Set(gauges.map(gauge => gauge.chain))];
    // for each chain, add the gauges to the checkpointer contract
    for (let i = 0; i < chains.length; i++) {
        const chain = chains[i];
        console.log('Adding gauges for chain ', chain);
        const gaugesForChain = gauges.filter(gauge => gauge.chain === chain);
        // create an empty array to store the gauges that need to be added to the checkpointer
        let gaugesToAdd = [];
        for (let j = 0; j < gaugesForChain.length; j++) {
            const gaugeAddress = gaugesForChain[j].id;
            const gaugeType = gaugesForChain[j].chain;
            // check if the gauge exists in the gauge checkpointer contract
            const gaugeExists = await checkpointerContract.connect(signer).hasGauge(gaugeType, gaugeAddress);
            // if the gauge doesn't exist, add it to the list of gauges to add
            if (!gaugeExists) {
                gaugesToAdd.push(gaugeAddress);
            }
        }
        // add the gauges to the checkpointer contract
        if (gaugesToAdd.length > 0) {
            console.log('Adding gauges ', gaugesToAdd, ' of type ', chain, ' to the checkpointer contract');
            const tx = await checkpointerContract.connect(signer).addGauges(chain, gaugesToAdd);
            console.log(tx);
        } else {
            console.log('No gauges to add for chain ', chain);
        }
    }
}

// To run locally (this code will not be executed in Autotasks)
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