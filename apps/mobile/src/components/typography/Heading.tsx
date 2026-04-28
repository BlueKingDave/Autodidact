import { styled, Text } from 'tamagui';

export const Heading = styled(Text, {
  name: 'Heading',
  color: '$text',
  fontWeight: '700',

  variants: {
    size: {
      h1: { fontSize: '$7', lineHeight: 38 },
      h2: { fontSize: '$6', lineHeight: 32 },
    },
  } as const,

  defaultVariants: {
    size: 'h1',
  },
});
