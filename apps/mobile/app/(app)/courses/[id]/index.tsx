import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCourse } from '../../../../src/api/courses';
import { useProgress } from '../../../../src/api/progress';
import { colors } from '../../../../src/constants/colors';
import type { ModuleBlueprint } from '@autodidact/types';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: course, isLoading } = useCourse(id);
  const { data: progress } = useProgress(id);

  const progressMap = new Map(progress?.map((p) => [p.moduleId, p]) ?? []);
  const completedCount = progress?.filter((p) => p.status === 'completed').length ?? 0;
  const totalCount = progress?.length ?? 0;
  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!course) return null;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.description}>{course.description}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount}/{totalCount} modules</Text>
          </View>
        </View>
      }
      data={(course.modules ?? []) as ModuleBlueprint[]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const modProgress = progressMap.get(item.id);
        const status = modProgress?.status ?? 'locked';
        const isLocked = status === 'locked';
        const isCompleted = status === 'completed';

        return (
          <TouchableOpacity
            style={[styles.moduleCard, isLocked && styles.moduleLocked]}
            disabled={isLocked}
            onPress={() =>
              router.push(`/(app)/courses/${id}/modules/${item.id}/chat`)
            }
          >
            <View style={styles.moduleHeader}>
              <View style={[styles.positionBadge, isCompleted && styles.positionCompleted]}>
                <Text style={styles.positionText}>
                  {isCompleted ? '✓' : item.position + 1}
                </Text>
              </View>
              <View style={styles.moduleInfo}>
                <Text style={[styles.moduleTitle, isLocked && styles.textLocked]}>
                  {item.title}
                </Text>
                <Text style={styles.statusText}>{status.replace('_', ' ')}</Text>
              </View>
              {!isLocked && <Text style={styles.chevron}>›</Text>}
            </View>
            <Text style={[styles.moduleDesc, isLocked && styles.textLocked]} numberOfLines={2}>
              {item.description}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 10 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  description: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: 20 },
  progressContainer: { marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: colors.surfaceHigh, borderRadius: 3, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { color: colors.textMuted, fontSize: 13 },
  moduleCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moduleLocked: { opacity: 0.45 },
  moduleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 12 },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionCompleted: { backgroundColor: colors.success },
  positionText: { color: colors.text, fontSize: 14, fontWeight: '700' },
  moduleInfo: { flex: 1 },
  moduleTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  statusText: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  moduleDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  textLocked: { color: colors.textDim },
  chevron: { color: colors.textMuted, fontSize: 22 },
});
