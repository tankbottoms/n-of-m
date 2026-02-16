import { PathType } from './types';

export const DERIVATION_PATHS: Record<PathType, { label: string; template: string; description: string }> = {
  metamask: {
    label: 'MetaMask',
    template: "m/44'/60'/0'/0/{index}",
    description: 'Standard BIP44 - MetaMask, Rainbow, most web wallets',
  },
  ledger: {
    label: 'Ledger',
    template: "m/44'/60'/{index}'/0/0",
    description: 'Ledger Live derivation path',
  },
  custom: {
    label: 'Custom',
    template: '',
    description: 'Enter your own derivation path',
  },
};

export function getDerivationPath(
  pathType: PathType,
  index: number,
  customPath?: string
): string {
  if (pathType === 'custom' && customPath) {
    return customPath.replace('{index}', String(index));
  }
  return DERIVATION_PATHS[pathType].template.replace('{index}', String(index));
}

export function getBasePath(pathType: PathType, customPath?: string): string {
  if (pathType === 'custom' && customPath) {
    return customPath.split('{index}')[0].replace(/\/+$/, '');
  }
  return DERIVATION_PATHS[pathType].template.replace('/{index}', '');
}

export const DEFAULT_ADDRESS_COUNT = 10;
export const DEFAULT_WORD_COUNT = 24;
export const DEFAULT_PATH_TYPE: PathType = 'metamask';
