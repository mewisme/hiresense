export interface DiscloudBotConfig {
  id: string;
  token: string;
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function decodeDiscordBotId(token: string): string {
  const [encodedId, middle, signature, ...rest] = token.split('.');
  if (!encodedId || !middle || !signature || rest.length > 0) throw new Error('Invalid Discord bot token format');

  let id: string;

  try {
    id = Buffer.from(encodedId, 'base64url').toString('utf8');
  } catch {
    throw new Error('Invalid Discord bot token id');
  }

  if (!/^\d{17,20}$/.test(id)) throw new Error('Invalid Discord bot token id');
  return id;
}

export function parseDiscloudBots(tokensValue: string | undefined): DiscloudBotConfig[] {
  const tokens = parseCsv(tokensValue);
  const seenIds = new Set<string>();

  return tokens.map((token) => {
    const id = decodeDiscordBotId(token);
    if (seenIds.has(id)) throw new Error(`Duplicate DisCloud bot id: ${id}`);
    seenIds.add(id);
    return { id, token };
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
  const bots = parseDiscloudBots(process.env.DISCLOUD_BOT_TOKENS);

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