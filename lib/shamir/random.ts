import { Buffer } from 'buffer';
import * as ExpoCrypto from 'expo-crypto';

function random(size: number): Buffer {
  const arr = ExpoCrypto.getRandomBytes(32 + size);
  return Buffer.from(arr.slice(32));
}

export { random };
