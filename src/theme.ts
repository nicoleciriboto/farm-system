export const colors = {
  // Forest Greens (Brand Primary)
  forest900: '#102A1C',
  forest800: '#1B4A33',
  forest700: '#245C40',
  forest600: '#2F7351',
  forest500: '#3E8C64',
  forest300: '#8BAF91',
  forest200: '#A3C4AF',
  forest100: '#D1E2D7',
  forest50: '#E8F0EB',

  // Sage Greens
  sage700: '#3C5643',
  sage600: '#4A6B52',
  sage500: '#5A8064',
  sage200: '#B9D0C3',
  sage100: '#DDE9E0',
  sage50: '#F0F5F1',

  // Amber / Warm Yellows (Warnings / Tasks)
  amber700: '#8F5318',
  amber600: '#B36D1F',
  amber500: '#D4882A',
  amber400: '#E9A23B',
  amber300: '#EFB85A',
  amber200: '#F4D08B',
  amber100: '#FAE8C7',
  amber50: '#FDF6E9',

  // Rust / Coral Reds (Urgent / Overdue)
  rust600: '#872828',
  rust500: '#A83333',
  rust400: '#C74747',
  rust100: '#F5D5D5',
  rust50: '#FBEAEA',
  danger: '#A83333',

  // Neutral Cream & Backgrounds
  cream50: '#FBFCF9',
  cream100: '#F7F8F4',
  cream200: '#EFF1E8',
  cream300: '#E5E8DC',

  // Charcoal & Text
  charcoal900: '#10140F',
  charcoal800: '#1A1F1C',
  charcoal700: '#252B27',
  charcoal600: '#363B36',
  charcoal500: '#4A4F49',
  charcoal400: '#6E746D',
  charcoal300: '#9CA29A',
  charcoal200: '#C5C9C0',
  charcoal100: '#E0E2DD',
  charcoal50: '#F2F3F1',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Type scale (aligned with iOS / Material 3 text styles). Use these instead of raw numbers.
export const font = {
  label: 11, // badges, tab labels, all-caps overlines
  caption: 12, // metadata, helper & error text
  body: 14, // default body and secondary lines
  bodyLarge: 16, // list titles, inputs, buttons
  title: 17, // section headers, modal & nav titles
  titleLarge: 22, // screen titles, key figures
  display: 32, // hero numbers
};

export const weight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Icon sizes — all icons come from Ionicons (outline style, filled when active)
export const icon = {
  sm: 16, // inline with text, chevrons
  md: 20, // buttons, list leading icons
  lg: 24, // tab bar, header actions
  xl: 40, // empty states
};
