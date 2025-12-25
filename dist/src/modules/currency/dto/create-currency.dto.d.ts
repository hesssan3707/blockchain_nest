export declare class CreateCurrencyDto {
    symbol: string;
    blockchain: string;
    token_address?: string | null;
    token_abi?: any | null;
    min_withdrawal_amount: number;
    min_balance_collector_amount: number;
}
