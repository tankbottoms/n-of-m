export type LayoutType = 'full-page' | '2-up' | 'wallet-size';

export interface LayoutConfig {
  label: string;
  description: string;
  cardsPerPage: number;
  cardWidth: string;
  cardHeight: string;
  qrSize: number;
  orientation: 'portrait' | 'landscape';
  fontSize: number;
}

export const LAYOUTS: Record<LayoutType, LayoutConfig> = {
  'full-page': {
    label: 'Full Page',
    description: 'One card per page, large QR code, full detail',
    cardsPerPage: 1,
    cardWidth: '100%',
    cardHeight: '100%',
    qrSize: 280,
    orientation: 'portrait',
    fontSize: 11,
  },
  '2-up': {
    label: 'Compact',
    description: 'Two cards per page, medium QR code',
    cardsPerPage: 2,
    cardWidth: '100%',
    cardHeight: '48%',
    qrSize: 160,
    orientation: 'portrait',
    fontSize: 9,
  },
  'wallet-size': {
    label: 'Wallet Size',
    description: 'All cards on one sheet, small QR codes',
    cardsPerPage: 999,
    cardWidth: '100%',
    cardHeight: 'auto',
    qrSize: 120,
    orientation: 'portrait',
    fontSize: 8,
  },
};
