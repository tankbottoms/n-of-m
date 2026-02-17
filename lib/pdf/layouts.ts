export type LayoutType = 'full-page' | '2-up' | 'wallet-size';

export interface LayoutConfig {
  label: string;
  description: string;
  cardsPerPage: number;
  cardWidth: string;
  cardHeight: string;
  qrSize: number;
  orientation: 'portrait' | 'landscape';
}

// Every layout now enforces one card per page.
// Layout type controls QR size and orientation only.
export const LAYOUTS: Record<LayoutType, LayoutConfig> = {
  'full-page': {
    label: 'Full Page',
    description: 'One card per page, large QR code',
    cardsPerPage: 1,
    cardWidth: '100%',
    cardHeight: '100%',
    qrSize: 240,
    orientation: 'portrait',
  },
  '2-up': {
    label: 'Compact',
    description: 'One card per page, medium QR code',
    cardsPerPage: 1,
    cardWidth: '100%',
    cardHeight: '100%',
    qrSize: 180,
    orientation: 'portrait',
  },
  'wallet-size': {
    label: 'Wallet Size',
    description: 'One card per page, small QR code',
    cardsPerPage: 1,
    cardWidth: '100%',
    cardHeight: '100%',
    qrSize: 140,
    orientation: 'portrait',
  },
};
