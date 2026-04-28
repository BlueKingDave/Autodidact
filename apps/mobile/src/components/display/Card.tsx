import type { ReactNode } from 'react';
import { styled, YStack } from 'tamagui';

const CardFrame = styled(YStack, {
  name: 'Card',
  borderRadius: '$md',
  padding: '$4',

  variants: {
    variant: {
      default:  {
        backgroundColor: '$surface',
        borderWidth: 1,
        borderColor: '$border',
      },
      elevated: {
        backgroundColor: '$surfaceHover',
        borderWidth: 0,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$border',
        // borderStyle: 'dashed' omitted — not reliably supported in RN Tamagui
      },
    },
    pressable: {
      true: { pressStyle: { opacity: 0.85 } },
    },
    disabled: {
      true: { opacity: 0.45 },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

type CardProps = {
  variant?: 'default' | 'elevated' | 'ghost';
  onPress?: () => void;
  disabled?: boolean;
  children: ReactNode;
};

export function Card({ variant = 'default', onPress, disabled = false, children }: CardProps) {
  return (
    <CardFrame
      variant={variant}
      pressable={!!onPress}
      disabled={disabled}
      onPress={disabled ? undefined : onPress}
    >
      {children}
    </CardFrame>
  );
}
