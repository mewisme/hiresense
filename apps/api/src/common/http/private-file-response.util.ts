import type { Response } from 'express';

export function applyPrivateFileResponseHeaders(response: Response) {
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('X-Content-Type-Options', 'nosniff');
}
