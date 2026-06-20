import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

interface MetricCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'profit' | 'loss';
}

export function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
  const valueColor =
    tone === 'profit' ? colors.profit : tone === 'loss' ? colors.loss : colors.text;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
});
