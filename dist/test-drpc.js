"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
async function test() {
    const variants = [
        { url: 'https://litecoin.drpc.org', headers: {} },
        { url: 'https://litecoin.drpc.org', headers: { 'X-DRPC-NETWORK': 'litecoin' } },
        { url: 'https://lb.drpc.org/ogrpc?network=litecoin', headers: {} },
        { url: 'https://drpc.org/rpc/litecoin', headers: {} },
    ];
    const payloads = [
        { jsonrpc: '2.0', id: 1, method: 'getblockchaininfo', params: [] },
        { jsonrpc: '1.0', id: 1, method: 'getblockchaininfo', params: [] },
        { jsonrpc: '2.0', id: 1, method: 'getblockcount', params: [] }
    ];
    for (const variant of variants) {
        console.log(`\n--- Testing ${variant.url} ---`);
        for (const payload of payloads) {
            try {
                const res = await axios_1.default.post(variant.url, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0',
                        ...variant.headers
                    },
                    timeout: 5000
                });
                console.log(`Success with payload ${payload.method} (v${payload.jsonrpc}):`, JSON.stringify(res.data).substring(0, 200));
            }
            catch (err) {
                console.log(`Failed with payload ${payload.method} (v${payload.jsonrpc}): ${err.message} ${err.response?.status || ''}`);
                if (err.response?.data) {
                    console.log(`  Data: ${JSON.stringify(err.response.data)}`);
                }
            }
        }
    }
}
test();
//# sourceMappingURL=test-drpc.js.map