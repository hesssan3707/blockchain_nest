import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  blockchainName!: string;

  @IsString()
  userIdentifier!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  publicKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  privateKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mnemonic?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  memo?: number;
}
