import type { ReactNode } from 'react';
import { styled, XStack, Spinner } from 'tamagui';
import { AppText } from '../typography/AppText';

const ButtonFrame = styled(XStack, {
  name: 'Button',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '$md',
  pressStyle: { opacity: 0.75 },

  variants: {
    variant: {
      primary: { backgroundColor: '$primary' },
      danger:  { backgroundColor: '$danger' },
      ghost:   { backgroundColor: 'transparent', borderWidth: 1, borderColor: '$border' },
    },
    size: {
      sm: { paddingHorizontal: '$3', paddingVertical: '$2', height: 36 },
      md: { paddingHorizontal: '$4', paddingVertical: '$3', height: 44 },
      lg: { paddingHorizontal: '$4', paddingVertical: '$4', height: 52 },
    },
    disabled: {
      true: { opacity: 0.4 },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

type ButtonProps = {
  variant?: 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  children,
}: ButtonProps) {
  return (
    <ButtonFrame
      variant={variant}
      size={size}
      disabled={disabled || loading}
      onPress={disabled || loading ? undefined : onPress}
    >
      {loading ? (
        <XStack gap="$2" alignItems="center">
          <Spinner size="small" color="$text" />
          <AppText weight="semibold" color="$text">{children}</AppText>
        </XStack>
      ) : (
        <AppText weight="semibold" color="$text">{children}</AppText>
      )}
    </ButtonFrame>
  );
}
