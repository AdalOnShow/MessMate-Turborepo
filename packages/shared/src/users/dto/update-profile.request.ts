import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;
}
