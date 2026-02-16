import { logs, exps } from '../table';
import { BIT_SIZE } from '../constants';

describe('GF(2^8) lookup table', () => {
  it('generates tables of correct size', () => {
    expect(exps).toHaveLength(BIT_SIZE);
    expect(logs).toHaveLength(BIT_SIZE);
  });

  it('has exps[0] = 1', () => {
    expect(exps[0]).toBe(1);
  });

  it('logs and exps are inverses', () => {
    for (let i = 1; i < BIT_SIZE; i++) {
      expect(exps[logs[i]]).toBe(i);
    }
  });
});
