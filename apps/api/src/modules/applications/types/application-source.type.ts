export const APPLICATION_SOURCES = ['DIRECT'] as const;
export type ApplicationSource = (typeof APPLICATION_SOURCES)[number];

export function isApplicationSource(value: string): value is ApplicationSource {
  return (APPLICATION_SOURCES as readonly string[]).includes(value);
}