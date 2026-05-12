import { Component, type ReactNode } from 'react';
import { YStack } from 'tamagui';
import { AppText } from '../typography/AppText';
import { Button } from '../interactive/Button';
import { Card } from '../display/Card';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <YStack flex={1} backgroundColor="$bg" alignItems="center" justifyContent="center" padding="$6" gap="$4">
          <Card variant="default">
            <YStack gap="$3" alignItems="center">
              <AppText variant="body" weight="semibold" textAlign="center">
                Something went wrong
              </AppText>
              <AppText variant="muted" textAlign="center">
                An unexpected error occurred. Please try again.
              </AppText>
              <Button
                variant="ghost"
                size="md"
                onPress={() => this.setState({ hasError: false })}
              >
                Try again
              </Button>
            </YStack>
          </Card>
        </YStack>
      );
    }

    return this.props.children;
  }
}
