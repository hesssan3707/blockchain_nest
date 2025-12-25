
import axios from 'axios';

async function testTronBatch() {
    console.log('--- Testing TRON Batch Fetch ---');
    const urls = [
        'https://api.trongrid.io/wallet/getblockbyrange',
        'https://api.trongrid.io/walletsolidity/getblockbyrange'
    ];
    const min = 78604448;
    const max = 78604458;
    
    const payloads = [
        { startNum: min, endNum: max },
        { start_num: min, end_num: max },
        { from: min, to: max }
    ];

    for (const url of urls) {
        for (const payload of payloads) {
            try {
                console.log(`Testing TRON URL (POST): ${url} with ${JSON.stringify(payload)}`);
                const response = await axios.post(url, payload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });
                console.log(`TRON Batch Success via ${url}: Found blocks`);
                return; // Stop if success
            } catch (err) {
                console.error(`TRON Batch Failed via ${url} (POST) with ${JSON.stringify(payload)}: ${err.message}`);
            }
        }
    }
}

async function testLtcRpc() {
    console.log('\n--- Testing LTC RPC ---');
    const urls = [
        'https://rpc.ankr.com/litecoin',
        'https://litecoin.drpc.org',
        'https://litecoin.blockpi.network/v1/rpc/public'
    ];
    
    for (const url of urls) {
        const payloads = [
            { jsonrpc: '2.0', id: 1, method: 'getblockcount', params: [] },
            { jsonrpc: '1.0', id: 'test', method: 'getblockcount', params: [] }
        ];
        
        for (const payload of payloads) {
            try {
                console.log(`Testing LTC URL: ${url} with JSON-RPC ${payload.jsonrpc}`);
                const response = await axios.post(url, payload, {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                });
                if (response.data && response.data.result !== undefined) {
                    console.log(`LTC Success via ${url}: Block Count = ${response.data.result}`);
                    return;
                }
                console.log(`LTC Response via ${url} (no result): ${JSON.stringify(response.data)}`);
            } catch (err) {
                console.error(`LTC Failed via ${url} with JSON-RPC ${payload.jsonrpc}: ${err.message}`);
            }
        }
    }
}

async function run() {
    await testTronBatch();
    await testLtcRpc();
}

run();
