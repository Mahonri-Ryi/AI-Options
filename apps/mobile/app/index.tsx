import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getGroupedStrategies, ROUTE_BY_STRATEGY } from '../constants/strategies';
import { colors, spacing } from '../constants/theme';

export default function HomeScreen() {
  const groups = getGroupedStrategies();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.title}>Options Calculators</Text>
        <Text style={styles.subtitle}>
          Model profit and loss for every major options strategy. All calculations run locally on
          your device for instant results.
        </Text>
      </View>

      {groups.map((group) => (
        <View key={group.category} style={styles.section}>
          <Text style={styles.sectionTitle}>{group.label}</Text>
          <View style={styles.grid}>
            {group.strategies.map((strategy) => (
              <Link
                key={strategy.id}
                href={ROUTE_BY_STRATEGY[strategy.id] as `/calculator/${string}`}
                asChild
              >
                <TouchableOpacity style={styles.card}>
                  <Text style={styles.cardTitle}>{strategy.name}</Text>
                  <Text style={styles.cardDescription}>{strategy.description}</Text>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  grid: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
