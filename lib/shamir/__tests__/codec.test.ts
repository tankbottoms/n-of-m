import { Buffer } from 'buffer';
import { pad, hex, bin, encode, decode, split } from '../codec';
import { BIT_COUNT } from '../constants';

describe('codec', () => {
  describe('pad', () => {
    it('returns unchanged text when length is already a multiple of BIT_COUNT', () => {
      const input = 'abcdefgh'; // length 8
      expect(pad(input)).toBe(input);
      expect(pad(input).length % BIT_COUNT).toBe(0);
    });

    it('adds leading zeros when length is not a multiple of BIT_COUNT', () => {
      const input = 'abc'; // length 3, needs 5 zeros to reach 8
      const result = pad(input);
      expect(result.length).toBe(BIT_COUNT);
      expect(result).toBe('00000abc');
    });

    it('uses custom multiple parameter', () => {
      const input = 'ab'; // length 2
      const result = pad(input, 4);
      expect(result.length % 4).toBe(0);
      expect(result).toBe('00ab');
    });
  });

  describe('hex', () => {
    it('converts simple ASCII digit string to hex', () => {
      // Each character is converted via charCodeAt -> Number(String.fromCharCode(...)).toString(16)
      // For digit characters: '1' -> charCode 49 -> Number('1') = 1 -> '1' -> padded to '0001'
      const result = hex('1');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('converts Buffer to hex', () => {
      const buf = Buffer.from([0x41, 0x42]); // 'AB'
      const result = hex(buf);
      expect(typeof result).toBe('string');
      // Buffer bytes are reversed (unshift): buf[0]=0x41 padded to '0041', buf[1]=0x42 padded to '0042'
      // unshift means buf[1] ends up first: '00420041'
      expect(result).toBe('00420041');
    });

    it('converts binary string to hex with BIN_ENCODING', () => {
      // '11111111' in binary = 0xff
      const result = hex('11111111', 'binary');
      expect(result).toBe('ff');
    });

    it('throws TypeError on invalid input (number)', () => {
      expect(() => hex(42 as unknown as string)).toThrow(TypeError);
    });
  });

  describe('bin', () => {
    it('converts hex string to binary', () => {
      // 'f' = parseInt('f', 16) = 15 = '1111' padded to '1111'
      const result = bin('f');
      expect(result).toBe('1111');
    });

    it('converts multi-char hex string to binary', () => {
      // 'ff' -> each char parsed as hex digit
      // Reversed iteration: i=1 -> 'f' -> 15 -> '1111', i=0 -> 'f' -> 15 -> '1111'
      // unshift builds left-to-right: '11111111'
      const result = bin('ff');
      expect(result).toBe('11111111');
    });

    it('converts Buffer to binary', () => {
      const buf = Buffer.from([0x0f]); // 15
      const result = bin(buf);
      // buf[0] = 15, toString(2) = '1111', padded to 4 bits = '1111'
      expect(result).toBe('1111');
    });
  });

  describe('encode', () => {
    it('creates correct header format with BIT_COUNT prefix and padded id', () => {
      const result = encode('01', 'data');
      // Header: BIT_COUNT.toString(36).toUpperCase() = '8'
      // id padding: (BIT_SIZE-1).toString(16).length = 255 -> 'ff' -> length 2
      // parsedId = parseInt('01', 16) = 1, padded to 2 hex chars = '01'
      // header = '8' + '01' = '801'
      // result = Buffer('801' + 'data') = Buffer('801data')
      expect(result.toString()).toBe('801data');
    });

    it('accepts Buffer data', () => {
      const data = Buffer.from('hello');
      const result = encode('0a', data);
      // header = '8' + '0a' = '80a'
      expect(result.toString().startsWith('80a')).toBe(true);
      expect(result.toString()).toBe('80ahello');
    });

    it('encodes higher id values correctly', () => {
      const result = encode('ff', 'x');
      // parsedId = 255, hex = 'ff', padded to 2 = 'ff'
      // header = '8' + 'ff' = '8ff'
      expect(result.toString()).toBe('8ffx');
    });
  });

  describe('decode', () => {
    it('reverses two-char hex encoding to buffer of byte values', () => {
      // Input '4142' with padding=4 (BYTES_PER_CHARACTER=2, so 2*2=4)
      // Already padded to multiple of 4
      // i=0: '4142'.slice(0,4) -> no, offset=padding=4
      // Actually: str is padded to multiple of 4, then sliced in chunks of 4
      // '4142' -> parseInt('4142', 16) = 16706 -> pushed as number
      // But typical usage is with 2-char hex bytes: 'ff' -> padded to '00ff'
      // -> parseInt('00ff', 16) = 255
      const result = decode('00ff');
      expect(result[0]).toBe(255);
    });

    it('decodes Buffer input', () => {
      const buf = Buffer.from('00ff');
      const result = decode(buf);
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result[0]).toBe(255);
    });

    it('roundtrips with hex for a Buffer', () => {
      // hex(Buffer.from([0x0a])) produces reversed unshift order
      // For a single-byte buffer: buf[0]=10 -> '10' padded to '000a'
      const hexStr = hex(Buffer.from([0x0a]));
      expect(hexStr).toBe('000a');
      const decoded = decode(hexStr);
      expect(decoded[0]).toBe(0x0a);
    });
  });

  describe('split', () => {
    it('chunks string into BIT_COUNT-sized integer array', () => {
      // Create a hex string of length 16 (two 8-char chunks)
      const input = 'ffffffff00000000'; // 16 hex chars
      const result = split(input, undefined, 16);
      // From the end: slice(8,16) = '00000000' -> parseInt(...,16) = 0
      // Then slice(0,8) = 'ffffffff' -> parseInt(...,16) = 4294967295
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(4294967295);
    });

    it('handles padding parameter', () => {
      // Input 'ff' with no padding: length 2, BIT_COUNT=8
      // Loop: i=2, 2 > 8 is false, so goes to final push: parseInt('ff', 16) = 255
      const result = split('ff', undefined, 16);
      expect(result).toEqual([255]);

      // With padding=8: 'ff' padded to '000000ff' (length 8)
      // Loop: i=8, 8 > 8 is false, final push: parseInt('000000ff', 16) = 255
      const padded = split('ff', 8, 16);
      expect(padded).toEqual([255]);
    });

    it('works with a longer string producing multiple chunks', () => {
      // 24 hex chars = 3 chunks of 8
      const input = 'aabbccddaabbccddaabbccdd';
      const result = split(input, undefined, 16);
      expect(result).toHaveLength(3);
    });
  });
});
