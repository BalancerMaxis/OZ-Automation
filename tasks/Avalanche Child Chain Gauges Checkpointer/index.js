const {
    DefenderRelaySigner,
    DefenderRelayProvider,
} = require('defender-relay-client/lib/ethers')
const { Relayer } = require('defender-relay-client');
const ethers = require('ethers')

const CHECKPOINTING_THRESHOLD = 10
const BAL_ADDRESS = '0xE15bCB9E0EA69e6aB9FA080c4c4A5632896298C3'
const BAL_ABI = `[ { "constant": true, "inputs": [], "name": "name", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "approve", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [ { "name": "", "type": "uint8" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "name": "balance", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transfer", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" } ], "name": "allowance", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" } ]`
const GAUGE_ABI = `[{"name":"Approval","inputs":[{"name":"_owner","type":"address","indexed":true},{"name":"_spender","type":"address","indexed":true},{"name":"_value","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"Transfer","inputs":[{"name":"_from","type":"address","indexed":true},{"name":"_to","type":"address","indexed":true},{"name":"_value","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"Deposit","inputs":[{"name":"_user","type":"address","indexed":true},{"name":"_value","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"Withdraw","inputs":[{"name":"_user","type":"address","indexed":true},{"name":"_value","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"UpdateLiquidityLimit","inputs":[{"name":"_user","type":"address","indexed":true},{"name":"_original_balance","type":"uint256","indexed":false},{"name":"_original_supply","type":"uint256","indexed":false},{"name":"_working_balance","type":"uint256","indexed":false},{"name":"_working_supply","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"stateMutability":"nonpayable","type":"constructor","inputs":[{"name":"_voting_escrow_delegation_proxy","type":"address"},{"name":"_bal_pseudo_minter","type":"address"},{"name":"_authorizer_adaptor","type":"address"},{"name":"_version","type":"string"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"deposit","inputs":[{"name":"_value","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"deposit","inputs":[{"name":"_value","type":"uint256"},{"name":"_user","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"withdraw","inputs":[{"name":"_value","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"withdraw","inputs":[{"name":"_value","type":"uint256"},{"name":"_user","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"transferFrom","inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"approve","inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"permit","inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"},{"name":"_deadline","type":"uint256"},{"name":"_v","type":"uint8"},{"name":"_r","type":"bytes32"},{"name":"_s","type":"bytes32"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"transfer","inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"increaseAllowance","inputs":[{"name":"_spender","type":"address"},{"name":"_added_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"decreaseAllowance","inputs":[{"name":"_spender","type":"address"},{"name":"_subtracted_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"user_checkpoint","inputs":[{"name":"addr","type":"address"}],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"nonpayable","type":"function","name":"claimable_tokens","inputs":[{"name":"addr","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"claimed_reward","inputs":[{"name":"_addr","type":"address"},{"name":"_token","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"claimable_reward","inputs":[{"name":"_user","type":"address"},{"name":"_reward_token","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"nonpayable","type":"function","name":"set_rewards_receiver","inputs":[{"name":"_receiver","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"claim_rewards","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"claim_rewards","inputs":[{"name":"_addr","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"claim_rewards","inputs":[{"name":"_addr","type":"address"},{"name":"_receiver","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"claim_rewards","inputs":[{"name":"_addr","type":"address"},{"name":"_receiver","type":"address"},{"name":"_reward_indexes","type":"uint256[]"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"add_reward","inputs":[{"name":"_reward_token","type":"address"},{"name":"_distributor","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"set_reward_distributor","inputs":[{"name":"_reward_token","type":"address"},{"name":"_distributor","type":"address"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"deposit_reward_token","inputs":[{"name":"_reward_token","type":"address"},{"name":"_amount","type":"uint256"}],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"killGauge","inputs":[],"outputs":[]},{"stateMutability":"nonpayable","type":"function","name":"unkillGauge","inputs":[],"outputs":[]},{"stateMutability":"view","type":"function","name":"decimals","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"allowance","inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"integrate_checkpoint","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"bal_token","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"bal_pseudo_minter","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"voting_escrow_delegation_proxy","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"authorizer_adaptor","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"nonpayable","type":"function","name":"initialize","inputs":[{"name":"_lp_token","type":"address"},{"name":"_version","type":"string"}],"outputs":[]},{"stateMutability":"view","type":"function","name":"DOMAIN_SEPARATOR","inputs":[],"outputs":[{"name":"","type":"bytes32"}]},{"stateMutability":"view","type":"function","name":"nonces","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"name","inputs":[],"outputs":[{"name":"","type":"string"}]},{"stateMutability":"view","type":"function","name":"symbol","inputs":[],"outputs":[{"name":"","type":"string"}]},{"stateMutability":"view","type":"function","name":"balanceOf","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"lp_token","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"version","inputs":[],"outputs":[{"name":"","type":"string"}]},{"stateMutability":"view","type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"working_balances","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"working_supply","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"period","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"period_timestamp","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"integrate_checkpoint_of","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"integrate_fraction","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"integrate_inv_supply","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"integrate_inv_supply_of","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"reward_count","inputs":[],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"reward_tokens","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"reward_data","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"tuple","components":[{"name":"distributor","type":"address"},{"name":"period_finish","type":"uint256"},{"name":"rate","type":"uint256"},{"name":"last_update","type":"uint256"},{"name":"integral","type":"uint256"}]}]},{"stateMutability":"view","type":"function","name":"rewards_receiver","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"address"}]},{"stateMutability":"view","type":"function","name":"reward_integral_for","inputs":[{"name":"arg0","type":"address"},{"name":"arg1","type":"address"}],"outputs":[{"name":"","type":"uint256"}]},{"stateMutability":"view","type":"function","name":"is_killed","inputs":[],"outputs":[{"name":"","type":"bool"}]},{"stateMutability":"view","type":"function","name":"inflation_rate","inputs":[{"name":"arg0","type":"uint256"}],"outputs":[{"name":"","type":"uint256"}]}]`
const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-gauges-avalanche'
const SUBGRAPH_QUERY = `{
    gaugeFactory(id:"0xf23b4db826dba14c0e857029dff076b1c0264843") {
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
    const balContract = new ethers.Contract(BAL_ADDRESS, BAL_ABI, signer);
    for (let i = 0; i < gauges.length; i++) {
        const gaugeAddress = gauges[i].id;
        const balBalance = await balContract.balanceOf(gaugeAddress);
        if (ethers.utils.formatUnits(balBalance, 18) > CHECKPOINTING_THRESHOLD) {
            console.log(gaugeAddress, ' balance above threshold, ', ethers.utils.formatUnits(balBalance, 18));
            const gaugeContract = new ethers.Contract(gaugeAddress, GAUGE_ABI, signer);
            const tx = await gaugeContract.connect(signer).user_checkpoint(gaugeAddress);
            console.log(tx);
        } else {
            console.log(gaugeAddress, ' balance below threshold, ', ethers.utils.formatUnits(balBalance, 18));
        }
    }
}