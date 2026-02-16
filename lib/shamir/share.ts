import { Buffer } from 'buffer';
import { BIT_SIZE } from './constants';

interface Share {
  id: number | null;
  bits: number | null;
  data: string | null;
}

function parse(input: string | Buffer): Share {
  const share: Share = { id: null, bits: null, data: null };

  let str: string;
  if (Buffer.isBuffer(input)) {
    str = input.toString('hex');
  } else {
    str = input;
  }

  if ('0' === str[0]) {
    str = str.slice(1);
  }

  // bit count is in base36
  share.bits = parseInt(str.slice(0, 1), 36);
  const maxBits = BIT_SIZE - 1;
  const idLength = maxBits.toString(16).length;
  const regex = `^([a-kA-K3-9]{1})([a-fA-F0-9]{${idLength}})([a-fA-F0-9]+)$`;
  const matches = new RegExp(regex).exec(str);

  if (matches && matches.length) {
    share.id = parseInt(matches[2], 16);
    share.data = matches[3];
  }

  return share;
}

export { parse };
export type { Share };
