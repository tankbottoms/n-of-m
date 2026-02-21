import { Buffer } from 'buffer';
import { parse } from '../share';

describe('share parse', () => {
  // Share format: optional '0', then 1 char base36 bit count, then 2-char hex id, then hex data
  // BIT_COUNT=8 in base36 is '8', MAX_SHARES=255 -> idLength = 'ff'.length = 2

  it('extracts bits from share string', () => {
    // '8' in base36 = 8 decimal
    const share = '801abcdef1234567890';
    const result = parse(share);
    expect(result.bits).toBe(8);
  });

  it('extracts id from share string', () => {
    // After bit char '8', next 2 chars are the id: '01' = 1
    const share = '801abcdef1234567890';
    const result = parse(share);
    expect(result.id).toBe(1);
  });

  it('extracts data from share string', () => {
    // After bit char and 2-char id, rest is data
    const share = '801abcdef1234567890';
    const result = parse(share);
    expect(result.data).toBe('abcdef1234567890');
  });

  it('handles Buffer input by converting to hex string', () => {
    // Buffer.toString('hex') produces hex representation of raw bytes
    // We need a buffer whose hex starts with a valid share prefix
    // Byte 0x08 = '08' in hex, then next byte is id, then data
    // '08' -> strip leading '0' -> '8', bit=8
    const buf = Buffer.from([0x08, 0x01, 0xab, 0xcd]);
    const result = parse(buf);
    // hex: '0801abcd' -> strip '0' -> '801abcd'
    // bits: parseInt('8', 36) = 8
    expect(result.bits).toBe(8);
    expect(result.id).toBe(1);
    expect(result.data).toBe('abcd');
  });

  it('handles leading zero by stripping it', () => {
    // '0801abcdef' -> strip '0' -> '801abcdef'
    const share = '0801abcdef';
    const result = parse(share);
    expect(result.bits).toBe(8);
    expect(result.id).toBe(1);
    expect(result.data).toBe('abcdef');
  });

  it('returns null fields for malformed input', () => {
    // A string that does not match the regex pattern
    const result = parse('xyz');
    expect(result.bits).not.toBeNull(); // bits is always parsed (parseInt of first char)
    expect(result.id).toBeNull();
    expect(result.data).toBeNull();
  });

  it('works with known integration share format (80 prefix)', () => {
    // From integration.test.ts: shares start with '80' when hex-encoded
    // '80' -> leading '0' stripped -> '80...' wait, that strips to give bit char '8'
    // Actually for hex shares: '801a4a3ab36c3cdfb4544b9cbd8b73f5a7f'
    const share = '801a4a3ab36c3cdfb4544b9cbd8b73f5a7f';
    const result = parse(share);
    expect(result.bits).toBe(8);
    // id = '01' -> 1
    expect(result.id).toBe(1);
    expect(result.data).toBe('a4a3ab36c3cdfb4544b9cbd8b73f5a7f');
  });
});
