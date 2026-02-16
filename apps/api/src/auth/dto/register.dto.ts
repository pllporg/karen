import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  organizationName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;

  @IsString()
  @IsOptional()
  fullName?: string;
}
