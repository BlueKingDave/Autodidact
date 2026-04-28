import { styled, XStack } from 'tamagui';
import { AppText } from '../typography/AppText';

const ChipFrame = styled(XStack, {
  name: 'Chip',
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$sm',
  borderWidth: 1,
  borderColor: '$border',
  backgroundColor: '$surface',
  pressStyle: { opacity: 0.8 },

  variants: {
    selected: {
      true: {
        borderColor: '$primary',
        backgroundColor: '$primarySubtle',
      },
    },
  } as const,
});

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <ChipFrame selected={selected} onPress={onPress}>
      <AppText
        variant={selected ? 'body' : 'muted'}
        weight={selected ? 'semibold' : 'regular'}
        color={selected ? '$primary' : '$textMuted'}
      >
        {label}
      </AppText>
    </ChipFrame>
  );
}
