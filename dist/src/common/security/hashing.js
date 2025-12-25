"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.md5Hex = md5Hex;
exports.sha256Bytes = sha256Bytes;
const crypto = require("crypto");
function md5Hex(input) {
    return crypto.createHash('md5').update(input).digest('hex');
}
function sha256Bytes(input) {
    return crypto.createHash('sha256').update(input, 'utf8').digest();
}
//# sourceMappingURL=hashing.js.map