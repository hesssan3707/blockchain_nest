"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPasswordDjangoPbkdf2Sha256 = hashPasswordDjangoPbkdf2Sha256;
exports.verifyPasswordDjangoPbkdf2Sha256 = verifyPasswordDjangoPbkdf2Sha256;
const crypto = require("crypto");
function hashPasswordDjangoPbkdf2Sha256(password, options) {
    const iterations = options?.iterations ?? 260000;
    const saltBytes = options?.saltBytes ?? 16;
    const salt = crypto.randomBytes(saltBytes).toString('base64url');
    const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    const hash = key.toString('base64');
    return `pbkdf2_sha256$${iterations}$${salt}$${hash}`;
}
function verifyPasswordDjangoPbkdf2Sha256(password, stored) {
    const parts = stored.split('$');
    if (parts.length !== 4)
        return false;
    const [algo, iterationsStr, salt, expectedHash] = parts;
    if (algo !== 'pbkdf2_sha256')
        return false;
    const iterations = Number(iterationsStr);
    if (!Number.isFinite(iterations) || iterations <= 0)
        return false;
    const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    const actualHash = key.toString('base64');
    return crypto.timingSafeEqual(Buffer.from(actualHash), Buffer.from(expectedHash));
}
//# sourceMappingURL=password.js.map