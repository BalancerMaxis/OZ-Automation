const ethers = require('ethers')

const LOW_BALANCE_THRESHOLD = 0.1 // ETH
const ADDRESSES = ['0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8']

// Entrypoint for the Autotask
exports.handler = async function (credentials, context) {
    console.log('Checking ETH balances for:');
    console.log(ADDRESSES);
    const provider = ethers.getDefaultProvider();
    for (let i = 0; i < ADDRESSES.length; i++) {
        const address = ADDRESSES[i];
        // Check the ethereum balance of address
        const ethBalance = await provider.getBalance(address);
        if (ethers.utils.formatEther(ethBalance) > LOW_BALANCE_THRESHOLD) {
            console.log(address, ' balance above threshold, ', ethers.utils.formatEther(ethBalance));
        } else {
            console.log(address, ' balance below threshold, ', ethers.utils.formatEther(ethBalance));

            const { notificationClient } = context;
            try {
                notificationClient.send({
                    channelAlias: '#defender-alerts',
                    subject: 'Address running low on ETH',
                    message: 'Address ' + address + ' is running low on ETH, only ' + ethers.utils.formatEther(ethBalance) + ' left.'
                });
            } catch (error) {
                console.error('Failed to send notification', error);
            }
        }
    }
}


