import { ApiResponse } from "../../api-response/api-response";
import { SigninDto } from "../dto/signin.dto";
import { SignupDto } from "../dto/signup.dto";

export interface SignInRequest extends SigninDto {}

export interface SignUpRequest extends SignupDto {}

export interface AuthTokensResponse {
  accessToken: string;
}

export type SignInResponse = ApiResponse<AuthTokensResponse>;

export type SignUpResponse = ApiResponse<AuthTokensResponse>;

export type RefreshResponse = ApiResponse<AuthTokensResponse>;

export interface LogoutResponse {
  ok: true;
}
