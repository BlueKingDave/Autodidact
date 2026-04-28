import type { ReactNode } from 'react';
import { ScrollView, YStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padding?: boolean;
};

export function Screen({ children, scroll = false, padding = true }: ScreenProps) {
  const inner = (
    <YStack flex={1} backgroundColor="$bg" padding={padding ? '$4' : 0}>
      {children}
    </YStack>
  );

  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView backgroundColor="$bg" contentContainerStyle={{ flexGrow: 1 }}>
          {inner}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={{ flex: 1 }}>{inner}</SafeAreaView>;
}
