import { describe, expect, it } from '@jest/globals';
import { decodeDiscordBotId, parseDiscloudBots } from './storage.config';

function tokenFor(id: string, suffix = 'signature'): string {
  return `${Buffer.from(id).toString('base64url')}.payload.${suffix}`;
}

describe('storage config', () => {
  it('decodes the Discord bot id from the token first segment', () => {
    expect(decodeDiscordBotId(tokenFor('123456789012345678'))).toBe('123456789012345678');
  });

  it('builds bot config from tokens without separate keys', () => {
    const first = tokenFor('123456789012345678', 'a');
    const second = tokenFor('987654321098765432', 'b');

    expect(parseDiscloudBots(`${first}, ${second}`)).toEqual([
      { id: '123456789012345678', token: first },
      { id: '987654321098765432', token: second },
    ]);
  });

  it('rejects duplicate bot ids even when token signatures differ', () => {
    const first = tokenFor('123456789012345678', 'a');
    const second = tokenFor('123456789012345678', 'b');
    expect(() => parseDiscloudBots(`${first},${second}`)).toThrow('Duplicate DisCloud bot id');
  });

  it('rejects an invalid Discord bot token', () => {
    expect(() => decodeDiscordBotId('invalid.token.value')).toThrow('Invalid Discord bot token id');
    expect(() => decodeDiscordBotId('missing-segments')).toThrow('Invalid Discord bot token format');
  });
});