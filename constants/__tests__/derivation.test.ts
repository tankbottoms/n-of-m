import {
  getDerivationPath,
  getBasePath,
  DERIVATION_PATHS,
  DEFAULT_PATH_TYPE,
  DEFAULT_WORD_COUNT,
  DEFAULT_ADDRESS_COUNT,
} from '../derivation';

describe('derivation', () => {
  describe('getDerivationPath', () => {
    it('metamask: replaces {index} with given index', () => {
      expect(getDerivationPath('metamask', 0)).toBe("m/44'/60'/0'/0/0");
      expect(getDerivationPath('metamask', 5)).toBe("m/44'/60'/0'/0/5");
    });

    it('ledger: replaces {index} in ledger template', () => {
      expect(getDerivationPath('ledger', 0)).toBe("m/44'/60'/0'/0/0");
      expect(getDerivationPath('ledger', 3)).toBe("m/44'/60'/3'/0/0");
    });

    it('custom: uses customPath with {index} replaced', () => {
      const customPath = "m/44'/0'/{index}'/0/0";
      expect(getDerivationPath('custom', 7, customPath)).toBe("m/44'/0'/7'/0/0");
    });
  });

  describe('getBasePath', () => {
    it('metamask: returns path without /{index} segment', () => {
      expect(getBasePath('metamask')).toBe("m/44'/60'/0'/0");
    });

    it('ledger: returns path without /{index} segment', () => {
      // Ledger template: "m/44'/60'/{index}'/0/0"
      // getBasePath replaces '/{index}' with '' -> "m/44'/60''/0/0"
      expect(getBasePath('ledger')).toBe("m/44'/60''/0/0");
    });

    it('custom: returns path up to {index} with trailing slash removed', () => {
      const customPath = "m/44'/0'/{index}'/0/0";
      expect(getBasePath('custom', customPath)).toBe("m/44'/0'");
    });
  });

  describe('DERIVATION_PATHS', () => {
    it('has all three path types', () => {
      expect(DERIVATION_PATHS).toHaveProperty('metamask');
      expect(DERIVATION_PATHS).toHaveProperty('ledger');
      expect(DERIVATION_PATHS).toHaveProperty('custom');
    });

    it('each entry has label, template, and description', () => {
      for (const key of ['metamask', 'ledger', 'custom'] as const) {
        expect(DERIVATION_PATHS[key]).toHaveProperty('label');
        expect(DERIVATION_PATHS[key]).toHaveProperty('template');
        expect(DERIVATION_PATHS[key]).toHaveProperty('description');
      }
    });
  });

  describe('defaults', () => {
    it('DEFAULT_PATH_TYPE is metamask', () => {
      expect(DEFAULT_PATH_TYPE).toBe('metamask');
    });

    it('DEFAULT_ADDRESS_COUNT is 10', () => {
      expect(DEFAULT_ADDRESS_COUNT).toBe(10);
    });

    it('DEFAULT_WORD_COUNT is 24', () => {
      expect(DEFAULT_WORD_COUNT).toBe(24);
    });
  });
});
