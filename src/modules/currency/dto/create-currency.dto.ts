import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCurrencyDto {
  @IsString()
  @MaxLength(255)
  symbol!: string;

  @IsString()
  blockchain!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  token_address?: string | null;

  @IsOptional()
  token_abi?: any | null;

  @IsNumber()
  @Min(0)
  min_withdrawal_amount!: number;

  @IsNumber()
  @Min(0)
  min_balance_collector_amount!: number;
}
