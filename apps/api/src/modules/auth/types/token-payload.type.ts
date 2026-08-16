export type TokenType =
  | 'access'
  | 'refresh';

export interface TokenPayload {
  sub: string;
  sid: string;
  typ: TokenType;
  jti: string;

  iat?: number;
  exp?: number;
}