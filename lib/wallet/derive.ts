import { HDNodeWallet } from 'ethers';
import { DerivedAddress, PathType } from '../../constants/types';
import { getDerivationPath } from '../../constants/derivation';

export function deriveAddresses(
  mnemonicPhrase: string,
  pathType: PathType,
  count: number,
  customPath?: string,
  passphrase?: string
): DerivedAddress[] {
  const root = HDNodeWallet.fromPhrase(mnemonicPhrase, passphrase ?? '', 'm');
  const addresses: DerivedAddress[] = [];

  for (let i = 0; i < count; i++) {
    const path = getDerivationPath(pathType, i, customPath);
    const wallet = root.derivePath(path);
    addresses.push({
      index: i,
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
  }

  return addresses;
}
