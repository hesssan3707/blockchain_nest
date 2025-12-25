import * as crypto from 'crypto';

export function md5Hex(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex');
}

export function sha256Bytes(input: string): Buffer {
  return crypto.createHash('sha256').update(input, 'utf8').digest();
}
