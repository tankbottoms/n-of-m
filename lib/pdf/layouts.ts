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

export const LAYOUTS: Record<LayoutType, LayoutConfig> = {
  'full-page': {
    label: 'Full Page',
    description: 'One card per page, large QR code',
    cardsPerPage: 1,
    cardWidth: '100%',
    cardHeight: '100%',
    qrSize: 300,
    orientation: 'portrait',
  },
  '2-up': {
    label: '2-Up',
    description: 'Two cards per page',
    cardsPerPage: 2,
    cardWidth: '100%',
    cardHeight: '48%',
    qrSize: 200,
    orientation: 'portrait',
  },
  'wallet-size': {
    label: 'Wallet Size',
    description: 'Credit card size, 4 per page',
    cardsPerPage: 4,
    cardWidth: '48%',
    cardHeight: '48%',
    qrSize: 120,
    orientation: 'landscape',
  },
};
