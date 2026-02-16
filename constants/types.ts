export type WordCount = 12 | 15 | 18 | 21 | 24;
export type PathType = 'metamask' | 'ledger' | 'custom';

export interface DerivedAddress {
  index: number;
  address: string;
  privateKey: string;
}

export interface ShamirConfig {
  threshold: number;
  totalShares: number;
}

export interface SecretRecord {
  id: string;
  name: string;
  createdAt: number;
  mnemonic: string;
  wordCount: WordCount;
  derivationPath: string;
  pathType: PathType;
  addressCount: number;
  addresses: DerivedAddress[];
  shamirConfig: ShamirConfig;
  metadata?: Record<string, string>;
  hasPassphrase: boolean;
  hasPIN: boolean;
}

export interface SharePayload {
  v: 1;
  id: string;
  name: string;
  shareIndex: number;
  totalShares: number;
  threshold: number;
  shareData: string;
  derivationPath: string;
  pathType: PathType;
  wordCount: WordCount;
  metadata?: Record<string, string>;
  hasPIN: boolean;
  hasPassphrase: boolean;
}
