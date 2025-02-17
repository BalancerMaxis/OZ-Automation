const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const { Relayer } = require('defender-relay-client');
const ethers = require('ethers')

const EVENT_EMITTER_ADDRESS = '0x8f32D631093B5418d0546f77442c5fa66187E59D'
const EMITTER_IDENTIFIER = '0x94e5a0dff823a8fce9322f522279854e2370a9ef309a74a7a86367e2a2872b2d'
const EVENT_EMITTER_ABI = '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"},{"indexed":true,"internalType":"bytes32","name":"identifier","type":"bytes32"}],"name":"AuthorizationGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"addr","type":"address"},{"indexed":true,"internalType":"bytes32","name":"identifier","type":"bytes32"}],"name":"AuthorizationRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"bytes32","name":"identifier","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"message","type":"bytes"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"LogArgument","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"bytes32","name":"identifier","type":"bytes32"},{"internalType":"address","name":"addr","type":"address"}],"name":"authorize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"identifier","type":"bytes32"},{"internalType":"bytes","name":"message","type":"bytes"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"emitEvent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"isAuthorized","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"identifier","type":"bytes32"},{"internalType":"address","name":"addr","type":"address"}],"name":"removeAuthorization","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]'
const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/75376/balancer-gauges-arbitrum/version/latest'
const SUBGRAPH_QUERY = `{
    gaugeFactory(id:"0x6817149cb753bf529565b4d023d7507ed2ff4bc0") {
      gauges {
        id
      }
    }
  }`

// aux function to get all gauges from subgraph
async function getGauges() {
    const response = await fetch(SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: SUBGRAPH_QUERY }),
    })
    const json = await response.json()
    return json.data.gaugeFactory.gauges
}


// Entrypoint for the Autotask
exports.handler = async function (event) {
    const relayer = new Relayer(event);
    // Use relayer for sending txs
    console.log('Getting gauges from the subgraph...');
    const gauges = await getGauges();
    console.log(gauges);
    const provider = new DefenderRelayProvider(event);
    const signer = new DefenderRelaySigner(event, provider, { speed: 'fast' });
    for (let i = 0; i < gauges.length; i++) {
        const gaugeAddress = gauges[i].id;
        console.log('Checkpointing gauge rewards for gauge: ' + gaugeAddress);
        const eventEmitter = new ethers.Contract(EVENT_EMITTER_ADDRESS, EVENT_EMITTER_ABI, signer);
        const tx = await eventEmitter.connect(signer).emitEvent(EMITTER_IDENTIFIER, gaugeAddress, 0);
        console.log(tx);
    }
}
