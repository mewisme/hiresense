export const storageConfig = () => ({
  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    bucket: process.env.STORAGE_BUCKET ?? 'hiresense',
  },
});
