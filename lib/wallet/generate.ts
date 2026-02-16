import { Mnemonic } from 'ethers';
import * as ExpoCrypto from 'expo-crypto';
import { WordCount } from '../../constants/types';

const WORD_COUNT_TO_ENTROPY: Record<WordCount, number> = {
  12: 128, 15: 160, 18: 192, 21: 224, 24: 256,
};

export function generateMnemonic(wordCount: WordCount = 24, extraEntropy?: Uint8Array): string {
  const entropyBits = WORD_COUNT_TO_ENTROPY[wordCount];
  const entropyBytes = entropyBits / 8;
  const entropy = ExpoCrypto.getRandomBytes(entropyBytes);

  if (extraEntropy) {
    for (let i = 0; i < entropy.length; i++) {
      entropy[i] ^= extraEntropy[i % extraEntropy.length];
    }
  }

  const mnemonic = Mnemonic.fromEntropy(entropy);
  return mnemonic.phrase;
}

export function validateMnemonic(phrase: string): boolean {
  try {
    Mnemonic.fromPhrase(phrase);
    return true;
  } catch {
    return false;
  }
}
