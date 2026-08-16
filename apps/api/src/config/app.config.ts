export const appConfig = () => ({
  app: {
    name: process.env.APP_NAME ?? 'HireSense API',
    port: Number(process.env.PORT ?? 3001),
    environment: process.env.NODE_ENV ?? 'development',
  },
});
