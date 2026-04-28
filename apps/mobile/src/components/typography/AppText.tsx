import { styled, Text } from 'tamagui';

export const AppText = styled(Text, {
  name: 'AppText',
  color: '$text',

  variants: {
    variant: {
      body:    { color: '$text',      fontSize: '$3' },
      muted:   { color: '$textMuted', fontSize: '$3' },
      caption: { color: '$textMuted', fontSize: '$2' },
      label:   { color: '$textMuted', fontSize: '$1', fontWeight: '600', textTransform: 'uppercase' },
      error:   { color: '$danger',    fontSize: '$2' },
    },
    size: {
      xs: { fontSize: '$1' },
      sm: { fontSize: '$2' },
      md: { fontSize: '$3' },
      lg: { fontSize: '$4' },
      xl: { fontSize: '$5' },
    },
    weight: {
      regular:  { fontWeight: '400' },
      semibold: { fontWeight: '600' },
      bold:     { fontWeight: '700' },
    },
  } as const,

  defaultVariants: {
    variant: 'body',
  },
});
