export type EncryptedPayload = `${string}:${string}:${string}`;
export declare function encryptWalletData(plainText: string): string;
export declare function decryptWalletData(payload: string): string;
export declare const encryptWalletPrivateKey: typeof encryptWalletData;
export declare const decryptWalletPrivateKey: typeof decryptWalletData;
