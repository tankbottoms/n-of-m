import { Buffer } from 'buffer';
import { horner } from './horner';

interface PointsOpts {
  threshold: number;
  shares: number;
  random: (size: number) => Buffer;
}

interface Point {
  x: number;
  y: number;
}

function points(a0: number, opts: PointsOpts): Point[] {
  const prng = opts.random;
  const a: number[] = [a0]; // p(0) = a0 = secret
  const p: Point[] = [];
  const t = opts.threshold;
  const n = opts.shares;

  for (let i = 1; i < t; ++i) {
    a[i] = parseInt(prng(1).toString('hex'), 16);
  }

  for (let i = 1; i < 1 + n; ++i) {
    p[i - 1] = {
      x: i,
      y: horner(i, a),
    };
  }

  return p;
}

export { points };
export type { PointsOpts, Point };
