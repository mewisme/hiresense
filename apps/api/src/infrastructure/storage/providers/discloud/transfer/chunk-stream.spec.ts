import { Readable } from 'node:stream';
import { describe, expect, it } from '@jest/globals';
import { chunkStream } from './chunk-stream';

describe('chunkStream', () => {
  it('splits a stream into ordered chunks', async () => {
    const stream = Readable.from([Buffer.from('abc'), Buffer.from('defghi')]);
    const chunks: Buffer[] = [];

    for await (const chunk of chunkStream(stream, 4)) {
      chunks.push(chunk);
    }

    expect(chunks.map((chunk) => chunk.toString())).toEqual(['abcd', 'efgh', 'i']);
  });
});