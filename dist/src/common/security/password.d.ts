export type DjangoPbkdf2Sha256Hash = `pbkdf2_sha256$${number}$${string}$${string}`;
export declare function hashPasswordDjangoPbkdf2Sha256(password: string, options?: {
    iterations?: number;
    saltBytes?: number;
}): DjangoPbkdf2Sha256Hash;
export declare function verifyPasswordDjangoPbkdf2Sha256(password: string, stored: string): boolean;
