import { styled, Input as TamaguiInput, YStack } from 'tamagui';
import type { GetProps } from 'tamagui';
import { AppText } from '../typography/AppText';

const StyledInput = styled(TamaguiInput, {
  name: 'Input',
  backgroundColor: '$surface',
  borderColor: '$border',
  borderWidth: 1,
  borderRadius: '$md',
  color: '$text',
  fontSize: '$4',
  paddingHorizontal: '$4',
  placeholderTextColor: '$textMuted',

  focusStyle: {
    borderColor: '$primary',
    outlineWidth: 0,
  },

  variants: {
    hasError: {
      true: { borderColor: '$danger' },
    },
  } as const,
});

type InputProps = GetProps<typeof StyledInput> & {
  label?: string;
  error?: string;
  helper?: string;
  /** React Native TextInput editable prop — prevents keyboard from appearing when false */
  editable?: boolean;
};

export function Input({ label, error, helper, editable, ...props }: InputProps) {
  return (
    <YStack gap="$1">
      {label && <AppText variant="label">{label}</AppText>}
      <StyledInput hasError={!!error} {...(editable === false ? { disabled: true } : {})} {...props} />
      {error
        ? <AppText variant="error">{error}</AppText>
        : helper
        ? <AppText variant="caption">{helper}</AppText>
        : null}
    </YStack>
  );
}
