export interface DiscloudBotConfig {
  key: string;
  token: string;
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function parseDiscloudBots(keysValue: string | undefined, tokensValue: string | undefined): DiscloudBotConfig[] {
  const keys = parseCsv(keysValue);
  const tokens = parseCsv(tokensValue);

  if (keys.length === 0 && tokens.length === 0) return [];
  if (keys.length !== tokens.length) throw new Error('DISCLOUD_BOT_KEYS and DISCLOUD_BOT_TOKENS must contain the same number of entries');

  const seenKeys = new Set<string>();

  return keys.map((key, index) => {
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(key)) throw new Error(`Invalid DisCloud bot key: ${key}`);
    if (seenKeys.has(key)) throw new Error(`Duplicate DisCloud bot key: ${key}`);

    seenKeys.add(key);

    const token = tokens[index];
    if (!token) throw new Error(`Missing token for DisCloud bot: ${key}`);

    return { key, token };
  });
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`Expected positive integer, received: ${value}`);

  return parsed;
}

export const storageConfig = () => {
  const provider = process.env.STORAGE_PROVIDER ?? 'discloud';
  const channelId = process.env.DISCLOUD_CHANNEL_ID;
  const bots = parseDiscloudBots(process.env.DISCLOUD_BOT_KEYS, process.env.DISCLOUD_BOT_TOKENS);

  if (provider === 'discloud' && !channelId) throw new Error('DISCLOUD_CHANNEL_ID is required when STORAGE_PROVIDER=discloud');
  if (provider === 'discloud' && bots.length === 0) throw new Error('At least one Discord bot is required when STORAGE_PROVIDER=discloud');

  return {
    storage: {
      provider,
      discloud: {
        apiBaseUrl: process.env.DISCLOUD_API_BASE_URL ?? 'https://discord.com/api/v10',
        channelId,
        bots,
        requestTimeoutMs: positiveInteger(process.env.DISCLOUD_REQUEST_TIMEOUT_MS, 120_000),
        maxAttempts: positiveInteger(process.env.DISCLOUD_MAX_ATTEMPTS, 5),
        chunkSizeBytes: positiveInteger(process.env.DISCLOUD_CHUNK_SIZE_BYTES, 8 * 1024 * 1024),
        uploadWorkers: positiveInteger(process.env.DISCLOUD_UPLOAD_WORKERS, 3),
      },
    },
  };
};