import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { useAuthStore } from '../../src/stores/auth.store';
import { colors } from '../../src/constants/colors';

const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
const supabase = createClient(extra?.['supabaseUrl'] ?? '', extra?.['supabaseAnonKey'] ?? '');

export default function ProfileScreen() {
  const { user, clearSession } = useAuthStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearSession();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 16, color: colors.text },
  signOutBtn: {
    backgroundColor: colors.error,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
