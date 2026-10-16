const shared = {
  trafficLight: '#237A55',
  trafficModerate: '#A85B08',
  trafficHeavy: '#B42318',
  trafficClosed: '#6241A5',
} as const;

export const colorPalettes = {
  light: {
    ...shared,
    background: '#F4F7F5',
    surface: '#FFFFFF',
    surfaceSecondary: '#EAF0ED',
    primary: '#176B57',
    primaryDark: '#104C3E',
    text: '#17231F',
    secondaryText: '#596760',
    mutedText: '#77847D',
    border: '#DCE5E0',
    tabBar: '#FFFFFF',
    overlay: 'rgba(18, 31, 25, 0.48)',
    success: '#237A55',
    warning: '#8A4B08',
    danger: '#B42318',
    onPrimary: '#FFFFFF',
    disabled: '#AAB8B0',
    trafficLight: shared.trafficLight,
    trafficModerate: shared.trafficModerate,
    trafficHeavy: shared.trafficHeavy,
    trafficClosed: shared.trafficClosed,
  },
  dark: {
    trafficLight: '#64D6A0',
    trafficModerate: '#FFC06A',
    trafficHeavy: '#FF8A80',
    trafficClosed: '#C2A6FF',
    background: '#111916',
    surface: '#1B2520',
    surfaceSecondary: '#27342D',
    primary: '#71D4B3',
    primaryDark: '#A0E8D0',
    text: '#F0F5F2',
    secondaryText: '#C0CDC5',
    mutedText: '#98A79F',
    border: '#34443B',
    tabBar: '#1B2520',
    overlay: 'rgba(0, 0, 0, 0.68)',
    success: '#64D6A0',
    warning: '#FFC06A',
    danger: '#FF8A80',
    onPrimary: '#10251E',
    disabled: '#54645B',
  },
} as const;

export type ColorScheme = keyof typeof colorPalettes;
export type AppPalette = (typeof colorPalettes)[ColorScheme];

export const theme = {
  colors: colorPalettes.light,
  palettes: colorPalettes,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
  },
  typography: {
    caption: 12,
    label: 14,
    body: 16,
    subheading: 18,
    heading: 24,
    display: 32,
  },
  traffic: {
    trafficLight: 'trafficLight',
    trafficModerate: 'trafficModerate',
    trafficHeavy: 'trafficHeavy',
    trafficClosed: 'trafficClosed',
  },
} as const;

export const mapStyles = {
  light: [],
  dark: [
    { elementType: 'geometry', stylers: [{ color: '#202a26' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#c0cdc5' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#202a26' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#394840' }] },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#52645a' }],
    },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#172522' }] },
  ],
} as const;
