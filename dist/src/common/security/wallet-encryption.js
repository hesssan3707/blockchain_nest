"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptWalletPrivateKey = exports.encryptWalletPrivateKey = void 0;
exports.encryptWalletData = encryptWalletData;
exports.decryptWalletData = decryptWalletData;
const crypto = require("crypto");
const hashing_1 = require("./hashing");
function getKeyBytes() {
    const secret = process.env.SECRET_KEY;
    if (!secret)
        return null;
    return (0, hashing_1.sha256Bytes)(secret);
}
function encryptWalletData(plainText) {
    const key = getKeyBytes();
    if (!key)
        return plainText;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const payload = `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
    return payload;
}
function decryptWalletData(payload) {
    const key = getKeyBytes();
    if (!key)
        return payload;
    const parts = payload.split(':');
    if (parts.length !== 3)
        return payload;
    const [ivB64, tagB64, encryptedB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(encryptedB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}
exports.encryptWalletPrivateKey = encryptWalletData;
exports.decryptWalletPrivateKey = decryptWalletData;
//# sourceMappingURL=wallet-encryption.js.map