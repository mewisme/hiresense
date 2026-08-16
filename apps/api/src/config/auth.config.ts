export const authConfig = () => ({
  auth: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTokenTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
});
