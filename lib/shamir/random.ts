import { Buffer } from 'buffer';

function random(size: number): Buffer {
  const arr = new Uint8Array(32 + size);
  crypto.getRandomValues(arr);
  return Buffer.from(arr.slice(32));
}

export { random };
