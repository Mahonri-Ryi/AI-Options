import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getGroupedStrategies, ROUTE_BY_STRATEGY } from '../constants/strategies';
import { colors, radius, spacing } from '../constants/theme';

export default function HomeScreen() {
  const groups = getGroupedStrategies();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>20 Calculators</Text>
        </View>
        <Text style={styles.title}>Model your options trades</Text>
        <Text style={styles.titleAccent}>before you trade</Text>
        <Text style={styles.subtitle}>
          Visualize profit and loss for every major options strategy. All calculations run locally
          for instant results.
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
                <TouchableOpacity style={styles.card} activeOpacity={0.75}>
                  <Text style={styles.cardTitle}>{strategy.name}</Text>
                  <Text style={styles.cardDescription}>{strategy.description}</Text>
                  <Text style={styles.cardArrow}>→</Text>
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
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleAccent: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
    borderRadius: radius.md,
    padding: spacing.md,
    paddingRight: spacing.xl,
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
  cardArrow: {
    position: 'absolute',
    right: spacing.md,
    top: '50%',
    marginTop: -10,
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});
