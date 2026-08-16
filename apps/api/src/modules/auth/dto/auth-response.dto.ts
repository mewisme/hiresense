export interface AuthUserResponse {
  id: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;

  tokenType: 'Bearer';

  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;

  user: AuthUserResponse;
}