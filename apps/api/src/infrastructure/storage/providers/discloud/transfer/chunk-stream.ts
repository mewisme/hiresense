import type { Readable } from 'node:stream';

export async function* chunkStream(stream: Readable, chunkSize: number): AsyncGenerator<Buffer> {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error('chunkSize must be a positive integer');
  }

  let pending = Buffer.alloc(0);

  for await (const value of stream) {
    const incoming = Buffer.isBuffer(value) ? value : Buffer.from(value);

    pending = pending.length === 0 ? incoming : Buffer.concat([pending, incoming]);

    while (pending.length >= chunkSize) {
      yield pending.subarray(0, chunkSize);
      pending = pending.subarray(chunkSize);
    }
  }

  if (pending.length > 0) {
    yield pending;
  }
}