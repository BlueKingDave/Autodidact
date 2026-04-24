import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserCourses } from '../../../src/api/courses';
import { colors } from '../../../src/constants/colors';

export default function MyCoursesScreen() {
  const router = useRouter();
  const { data: courses, isLoading } = useUserCourses();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={courses ?? []}
      keyExtractor={(item: { id: string }) => item.id}
      ListEmptyComponent={
        <Text style={styles.empty}>No courses yet. Start learning something!</Text>
      }
      renderItem={({ item }: { item: { id: string; title: string; description: string; difficulty: string; completedAt: string | null } }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/(app)/courses/${item.id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.difficulty}</Text>
            </View>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
          {item.completedAt && (
            <Text style={styles.completed}>✓ Completed</Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },
  center: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 60, fontSize: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text, marginRight: 8 },
  badge: { backgroundColor: `${colors.primary}33`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: colors.primaryLight, fontSize: 12, fontWeight: '600' },
  cardDesc: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  completed: { color: colors.success, fontSize: 13, marginTop: 8, fontWeight: '600' },
});
