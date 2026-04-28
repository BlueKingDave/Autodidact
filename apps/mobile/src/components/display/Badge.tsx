import { styled, XStack } from 'tamagui';
import { AppText } from '../typography/AppText';

const BadgeFrame = styled(XStack, {
  name: 'Badge',
  paddingHorizontal: '$2',
  paddingVertical: '$0.5',
  borderRadius: '$sm',
  alignSelf: 'flex-start',

  variants: {
    variant: {
      default: { backgroundColor: '$primarySubtle' },
      success: { backgroundColor: '$successSubtle' },
      warning: { backgroundColor: '$warningSubtle' },
      danger:  { backgroundColor: '$dangerSubtle' },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

const textColorMap = {
  default: '$primaryHover',
  success: '$success',
  warning: '$warning',
  danger:  '$danger',
} as const;

type BadgeProps = {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <BadgeFrame variant={variant}>
      <AppText variant="label" color={textColorMap[variant]}>
        {label}
      </AppText>
    </BadgeFrame>
  );
}
