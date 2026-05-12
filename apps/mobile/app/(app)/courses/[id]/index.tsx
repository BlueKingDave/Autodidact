import { FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, XStack, YStack } from 'tamagui';
import { useCourse } from '@/api/courses';
import { useProgress } from '@/api/progress';
import { Screen, Heading, AppText, Card, ProgressBar, PositionBadge, SkeletonLine, SkeletonCard } from '@/components';
import type { ModuleBlueprint } from '@autodidact/types';

function LoadingSkeleton() {
  return (
    <YStack gap="$3" paddingVertical="$1">
      <SkeletonLine width="70%" height={32} />
      <SkeletonLine width="100%" />
      <SkeletonLine width="100%" height={6} />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </YStack>
  );
}

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { data: course, isLoading, isRefetching: courseRefetching, refetch: refetchCourse } = useCourse(id);
  const { data: progress, isRefetching: progressRefetching, refetch: refetchProgress } = useProgress(id);

  const progressMap = new Map(progress?.map((p) => [p.moduleId, p]) ?? []);
  const completedCount = progress?.filter((p) => p.status === 'completed').length ?? 0;
  const totalCount = progress?.length ?? 0;
  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;

  const handleRefresh = () => {
    void refetchCourse();
    void refetchProgress();
  };

  if (isLoading) {
    return (
      <Screen>
        <LoadingSkeleton />
      </Screen>
    );
  }

  if (!course) return null;

  return (
    <Screen>
      <FlatList
        data={(course.modules ?? []) as ModuleBlueprint[]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={courseRefetching || progressRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.primary.get()}
          />
        }
        ListHeaderComponent={
          <YStack gap="$4" marginBottom="$4">
            <Heading size="h1">{course.title}</Heading>
            <AppText variant="muted">{course.description}</AppText>
            <ProgressBar value={progressPct} label={`${completedCount}/${totalCount} modules`} />
          </YStack>
        }
        renderItem={({ item }) => {
          const modProgress = progressMap.get(item.id);
          const status = modProgress?.status ?? 'locked';
          const isLocked = status === 'locked';
          const isCompleted = status === 'completed';

          return (
            <Card
              variant="default"
              onPress={isLocked ? undefined : () => router.push(`/(app)/courses/${id}/modules/${item.id}/chat`)}
              disabled={isLocked}
            >
              <XStack alignItems="center" gap="$3" marginBottom="$2">
                <PositionBadge position={item.position + 1} completed={isCompleted} />
                <YStack flex={1}>
                  <AppText variant="body" weight="semibold">{item.title}</AppText>
                  <AppText variant="caption">{status.replace('_', ' ')}</AppText>
                </YStack>
                {!isLocked && <AppText variant="muted" size="xl">›</AppText>}
              </XStack>
              <AppText variant="muted" size="sm" numberOfLines={2}>{item.description}</AppText>
            </Card>
          );
        }}
      />
    </Screen>
  );
}
