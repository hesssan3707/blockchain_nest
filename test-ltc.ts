
import axios from 'axios';

async function testLtc() {
    const urls = [
        'https://litecoin.drpc.org',
        'https://lb.drpc.org/ogrpc?network=litecoin',
        'https://litecoin-rpc.publicnode.com',
        'https://rpc.ankr.com/litecoin',
        'https://litecoin-mainnet.public.blastapi.io',
        'https://ltc.lava.build',
        'https://litecoin.api.onfinality.io/public',
        'https://litecoin-rpc.trezor.io',
        'https://ltc.publicnode.com',
        'https://litecoin.publicnode.com',
        'https://litecoin.drpc.org/rpc',
        'https://litecoin.drpc.org/v1/rpc',
        'https://rpc.blockpi.network/v1/rpc/public',
        'https://litecoin-mainnet.blastapi.io',
        'https://node.litecoin.org',
        'https://litecoin.litescribe.io/rpc',
        'https://ltc-mainnet.public.blastapi.io',
        'https://litecoin.rpc.nodes7.com',
        'https://rpc.litecoin.org'
    ];

    for (const url of urls) {
        console.log(`\n--- Testing ${url} ---`);
        const paths = ['', '/', '/rpc', '/mainnet'];
        
        for (const path of paths) {
            const fullUrl = url.replace(/\/+$/, '') + path;
            console.log(`  Path: ${path || '(root)'}`);
            
            const payloads = [
                { jsonrpc: '2.0', id: 1, method: 'getblockcount', params: [] },
                { jsonrpc: '1.0', id: 'test', method: 'getblockcount', params: [] }
            ];

            for (const payload of payloads) {
                try {
                    const res = await axios.post(fullUrl, payload, {
                        headers: { 
                            'Content-Type': 'application/json',
                            'User-Agent': 'Mozilla/5.0'
                        },
                        timeout: 5000
                    });
                    
                    if (res.data && (res.data.result !== undefined || typeof res.data === 'number')) {
                        console.log(`    SUCCESS! Payload v${payload.jsonrpc}: Result=${JSON.stringify(res.data.result ?? res.data)}`);
                        return; // Found one!
                    } else {
                        console.log(`    Failed: Empty or invalid response format: ${JSON.stringify(res.data)}`);
                    }
                } catch (err: any) {
                    console.log(`    Failed: ${err.message} ${err.response?.status || ''}`);
                    if (err.response?.data && typeof err.response.data === 'object') {
                        console.log(`      Data: ${JSON.stringify(err.response.data)}`);
                    }
                }
            }
        }
    }
}

testLtc();
