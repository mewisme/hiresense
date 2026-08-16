import { describe, expect, it } from '@jest/globals';
import { parseDiscloudBots } from './storage.config';

describe('parseDiscloudBots', () => {
  it('pairs bot keys and tokens by position', () => {
    expect(parseDiscloudBots('bot-a,bot-b,bot-c', 'token-a,token-b,token-c')).toEqual([
      { key: 'bot-a', token: 'token-a' },
      { key: 'bot-b', token: 'token-b' },
      { key: 'bot-c', token: 'token-c' },
    ]);
  });

  it('rejects mismatched bot and token counts', () => {
    expect(() => parseDiscloudBots('bot-a,bot-b', 'token-a')).toThrow();
  });

  it('rejects duplicate bot keys', () => {
    expect(() => parseDiscloudBots('bot-a,bot-a', 'token-a,token-b')).toThrow();
  });
});