export const aiConfig = () => ({
  ai: {
    baseUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
    timeoutMs: Number(process.env.AI_SERVICE_TIMEOUT_MS ?? 30000),
  },
});
