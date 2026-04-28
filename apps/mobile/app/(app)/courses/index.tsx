import { FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { XStack, YStack, Spinner } from 'tamagui';
import { useUserCourses } from '@/api/courses';
import { Screen, Card, AppText, Badge, EmptyState } from '@/components';

type Course = {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  completedAt: string | null;
};

export default function MyCoursesScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useUserCourses();

  if (isLoading) {
    return (
      <Screen>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$primary" />
        </YStack>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={courses ?? []}
        keyExtractor={(item: Course) => item.id}
        contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
        ListEmptyComponent={<EmptyState message="No courses yet. Start learning something!" />}
        renderItem={({ item }: { item: Course }) => (
          <Card variant="default" onPress={() => router.push(`/(app)/courses/${item.id}`)}>
            <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
              <YStack flex={1} marginRight="$2">
                <AppText variant="body" weight="semibold" size="lg">
                  {item.title}
                </AppText>
              </YStack>
              <Badge label={item.difficulty} />
            </XStack>
            <AppText variant="muted" size="sm" numberOfLines={2}>{item.description}</AppText>
            {item.completedAt && (
              <YStack marginTop="$2">
                <AppText variant="body" color="$success" size="sm">✓ Completed</AppText>
              </YStack>
            )}
          </Card>
        )}
      />
    </Screen>
  );
}
