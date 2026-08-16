import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const PUBLIC_REGISTRATION_ROLES = [
  'CANDIDATE',
  'RECRUITER',
] as const;

export type PublicRegistrationRole =
  (typeof PUBLIC_REGISTRATION_ROLES)[number];

export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
      : value,
  )
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsIn(PUBLIC_REGISTRATION_ROLES)
  role!: PublicRegistrationRole;
}