import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useCreateCourse } from '../../src/api/courses';
import { useCourseGeneration } from '../../src/hooks/useCourseGeneration';
import { colors } from '../../src/constants/colors';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export default function HomeScreen() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  const { mutateAsync: createCourse, isPending } = useCreateCourse();
  const { isGenerating, failed, status } = useCourseGeneration(pendingCourseId, pendingJobId);

  const handleStart = async () => {
    if (!topic.trim()) return;
    try {
      const result = await createCourse({ topic: topic.trim(), difficulty });
      if (result.status === 'ready' || result.reused) {
        // Course already exists, navigation handled by useCourseGeneration
        setPendingCourseId(result.courseId);
        setPendingJobId(null);
      } else {
        setPendingCourseId(result.courseId);
        setPendingJobId(result.jobId ?? null);
      }
    } catch {
      Alert.alert('Error', 'Failed to start course generation');
    }
  };

  const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>What do you want to learn?</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Rust programming, Byzantine history..."
        placeholderTextColor={colors.textDim}
        value={topic}
        onChangeText={setTopic}
        multiline
        maxLength={200}
      />

      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.difficultyRow}>
        {difficulties.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.difficultyChip, difficulty === d && styles.difficultyChipActive]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.difficultyText, difficulty === d && styles.difficultyTextActive]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, (isPending || isGenerating) && styles.buttonDisabled]}
        onPress={handleStart}
        disabled={isPending || isGenerating || !topic.trim()}
      >
        {isPending || isGenerating ? (
          <View style={styles.buttonInner}>
            <ActivityIndicator color={colors.text} size="small" />
            <Text style={styles.buttonText}>
              {isGenerating ? `Building course (${status ?? '...'})` : 'Starting...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Start Learning</Text>
        )}
      </TouchableOpacity>

      {failed && (
        <Text style={styles.errorText}>Course generation failed. Please try again.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 40 },
  heading: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 24 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  label: { fontSize: 14, color: colors.textMuted, marginBottom: 10, fontWeight: '600' },
  difficultyRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  difficultyChip: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  difficultyChipActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}22`,
  },
  difficultyText: { color: colors.textMuted, fontSize: 14 },
  difficultyTextActive: { color: colors.primary, fontWeight: '600' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonInner: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  errorText: { color: colors.error, marginTop: 16, textAlign: 'center' },
});
