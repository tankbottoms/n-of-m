import { Buffer } from 'buffer';
import { zeroes } from './table';

import {
  BYTES_PER_CHARACTER,
  UTF8_ENCODING,
  BIN_ENCODING,
  BIT_COUNT,
  BIT_SIZE,
} from './constants';

function pad(text: string, multiple?: number): string {
  let missing = 0;
  let result = text;

  if (!multiple) {
    multiple = BIT_COUNT;
  }

  if (text) {
    missing = text.length % multiple;
  }

  if (missing) {
    const offset = -((multiple - missing) + text.length);
    result = (zeroes + text).slice(offset);
  }

  return result;
}

function hex(buffer: string | Buffer, encoding?: string): string {
  const padding = 2 * BYTES_PER_CHARACTER;

  if (!encoding) {
    encoding = UTF8_ENCODING;
  }

  if ('string' === typeof buffer) {
    return fromString(buffer);
  }

  if (Buffer.isBuffer(buffer)) {
    return fromBuffer(buffer);
  }

  throw new TypeError('Expecting a string or buffer as input.');

  function fromString(buf: string): string {
    const chunks: string[] = [];

    if (UTF8_ENCODING === encoding) {
      for (let i = 0; i < buf.length; ++i) {
        const chunk = Number(String.fromCharCode(buf.charCodeAt(i))).toString(16);
        chunks.unshift(pad(chunk, padding));
      }
    }

    if (BIN_ENCODING === encoding) {
      buf = pad(buf, 4);

      for (let i = buf.length; i >= 4; i -= 4) {
        const bits = buf.slice(i - 4, i);
        const chunk = parseInt(bits, 2).toString(16);
        chunks.unshift(chunk);
      }
    }

    return chunks.join('');
  }

  function fromBuffer(buf: Buffer): string {
    const chunks: string[] = [];

    for (let i = 0; i < buf.length; ++i) {
      const chunk = buf[i].toString(16);
      chunks.unshift(pad(chunk, padding));
    }

    return chunks.join('');
  }
}

function bin(buffer: string | Buffer | number[], radix?: number): string {
  const chunks: string[] = [];

  if (!radix) {
    radix = 16;
  }

  for (let i = buffer.length - 1; i >= 0; --i) {
    let chunk: number | null = null;

    if (Buffer.isBuffer(buffer)) {
      chunk = buffer[i];
    }

    if ('string' === typeof buffer) {
      chunk = parseInt(buffer[i], radix);
    }

    if (Array.isArray(buffer)) {
      const item = buffer[i];

      if ('string' === typeof item) {
        chunk = parseInt(item, radix);
      } else {
        chunk = item;
      }
    }

    if (null === chunk) {
      throw new TypeError('Unsupported type for chunk in buffer array.');
    }

    chunks.unshift(pad(chunk.toString(2), 4));
  }

  return chunks.join('');
}

function encode(id: string, data: string | Buffer): Buffer {
  const parsedId = parseInt(id, 16);

  const padding = (BIT_SIZE - 1).toString(16).length;
  const header = Buffer.concat([
    Buffer.from(BIT_COUNT.toString(36).toUpperCase()), // 8
    Buffer.from(pad(parsedId.toString(16), padding)),
  ]);

  let dataBuffer: Buffer;
  if (false === Buffer.isBuffer(data)) {
    dataBuffer = Buffer.from(data);
  } else {
    dataBuffer = data;
  }

  return Buffer.concat([header, dataBuffer]);
}

function decode(buffer: string | Buffer, encoding?: BufferEncoding): Buffer {
  const padding = 2 * BYTES_PER_CHARACTER;
  const offset = padding;
  const chunks: number[] = [];

  let str: string;
  if (Buffer.isBuffer(buffer)) {
    str = buffer.toString(encoding);
  } else {
    str = buffer;
  }

  str = pad(str, padding);

  for (let i = 0; i < str.length; i += offset) {
    const bits = str.slice(i, i + offset);
    const chunk = parseInt(bits, 16);
    chunks.unshift(chunk);
  }

  return Buffer.from(chunks);
}

function split(string: string | Buffer, padding?: number, radix?: number): number[] {
  const chunks: number[] = [];
  let i = 0;

  let str: string;
  if (Buffer.isBuffer(string)) {
    str = string.toString();
  } else {
    str = string;
  }

  if (padding) {
    str = pad(str, padding);
  }

  for (i = str.length; i > BIT_COUNT; i -= BIT_COUNT) {
    const bits = str.slice(i - BIT_COUNT, i);
    const chunk = parseInt(bits, radix);
    chunks.push(chunk);
  }

  chunks.push(parseInt(str.slice(0, i), radix));

  return chunks;
}

export { encode, decode, split, bin, hex, pad };
