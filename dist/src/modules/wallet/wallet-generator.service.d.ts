export interface GeneratedWallet {
    address: string;
    privateKey: string;
    mnemonic?: string;
    memo?: number;
}
export declare class WalletGeneratorService {
    generate(blockchainName: string): Promise<GeneratedWallet>;
    private generateEvmWallet;
    private generateBtcWallet;
    private generateLtcWallet;
    private generateTronWallet;
    private generateXrpWallet;
}
