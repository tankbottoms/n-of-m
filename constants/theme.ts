export const PALETTES = {
  pastels: {
    label: 'Pastels',
    colors: [
      { name: 'Blue', hex: '#A8D8EA' },
      { name: 'Pink', hex: '#F4B8C1' },
      { name: 'Green', hex: '#B8E6C8' },
      { name: 'Yellow', hex: '#F9E8A0' },
      { name: 'Purple', hex: '#C8B8E6' },
      { name: 'Orange', hex: '#F4C9A8' },
    ],
  },
  bold: {
    label: 'Bold',
    colors: [
      { name: 'Blue', hex: '#0066FF' },
      { name: 'Pink', hex: '#FF0066' },
      { name: 'Green', hex: '#00FF66' },
      { name: 'Yellow', hex: '#FFFF00' },
    ],
  },
  muted: {
    label: 'Muted',
    colors: [
      { name: 'Rose', hex: '#C4A4A4' },
      { name: 'Sage', hex: '#A4C4A4' },
      { name: 'Slate', hex: '#7A8A9A' },
      { name: 'Amber', hex: '#C4A464' },
    ],
  },
} as const;

export const NEO = {
  bg: '#FFFFFF',
  text: '#000000',
  border: '#000000',
  borderWidth: 3,
  shadowOffset: 4,
  shadowColor: '#000000',
  radius: 0,
  defaultHighlight: '#A8D8EA',
  fontUI: 'SpaceGrotesk_400Regular',
  fontUIBold: 'SpaceGrotesk_700Bold',
  fontMono: 'SpaceMono_400Regular',
  fontIcon: 'IosevkaNerdFont',
  fontIconBold: 'IosevkaNerdFontBold',
} as const;

export const SHADOW = {
  shadowColor: NEO.shadowColor,
  shadowOffset: { width: NEO.shadowOffset, height: NEO.shadowOffset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: NEO.shadowOffset,
};

export const SHADOW_PRESSED = {
  shadowColor: NEO.shadowColor,
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2,
};
