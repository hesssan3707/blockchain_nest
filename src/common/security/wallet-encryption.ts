import * as crypto from 'crypto';
import { sha256Bytes } from './hashing';

export type EncryptedPayload = `${string}:${string}:${string}`;

function getKeyBytes(): Buffer | null {
  const secret = process.env.SECRET_KEY;
  if (!secret) return null;
  return sha256Bytes(secret);
}

export function encryptWalletData(plainText: string): string {
  const key = getKeyBytes();
  if (!key) return plainText;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload: EncryptedPayload = `${iv.toString('base64')}:${tag.toString(
    'base64',
  )}:${encrypted.toString('base64')}`;
  return payload;
}

export function decryptWalletData(payload: string): string {
  const key = getKeyBytes();
  if (!key) return payload;
  const parts = payload.split(':');
  if (parts.length !== 3) return payload;
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

// Keep aliases for backward compatibility if needed, but we will update them
export const encryptWalletPrivateKey = encryptWalletData;
export const decryptWalletPrivateKey = decryptWalletData;
