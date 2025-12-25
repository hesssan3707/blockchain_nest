import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBlockchainDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsNumber()
  @Min(0.0001)
  bpm?: number;
}
