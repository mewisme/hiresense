process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/hiresense';
process.env.SHADOW_DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/hiresense_shadow';
process.env.JWT_ACCESS_SECRET ??= 'hiresense-database-smoke-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'hiresense-database-smoke-refresh-secret';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL ??= '30d';
process.env.STORAGE_PROVIDER ??= 'discloud';
process.env.DISCLOUD_CHANNEL_ID ??= '123456789012345678';
process.env.DISCLOUD_BOT_TOKENS ??= 'MTIzNDU2Nzg5MDEyMzQ1Njc4.test.signature';
process.env.AI_SERVICE_URL ??= 'http://127.0.0.1:65535';
