"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
async function test() {
    const urls = [
        'https://go.getblock.io/d1c4959c9ba9443098ce8586ddb7c583',
        'https://litecoin.drpc.org'
    ];
    for (const url of urls) {
        console.log(`\n--- Testing ${url} ---`);
        const payloads = [
            { jsonrpc: '1.0', id: 'test', method: 'getblockcount', params: [] },
            { jsonrpc: '2.0', id: 1, method: 'getblockcount', params: [] }
        ];
        for (const payload of payloads) {
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (url.includes('drpc')) {
                    headers['X-DRPC-NETWORK'] = 'litecoin';
                }
                const res = await axios_1.default.post(url, payload, {
                    headers,
                    timeout: 5000
                });
                console.log(`SUCCESS v${payload.jsonrpc}: ${JSON.stringify(res.data).substring(0, 100)}`);
            }
            catch (err) {
                console.log(`FAILED v${payload.jsonrpc}: ${err.message} ${err.response?.status || ''}`);
                if (err.response?.data) {
                    console.log(`  Data: ${JSON.stringify(err.response.data).substring(0, 200)}`);
                }
            }
        }
    }
}
test();
//# sourceMappingURL=test-ltc-simple.js.map