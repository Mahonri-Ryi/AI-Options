import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PREMIUM_FEATURES, STRATEGIES } from '@ai-options/core';
import { getGroupedStrategies, ROUTE_BY_STRATEGY } from '../constants/strategies';
import { colors, radius, spacing } from '../constants/theme';
import { TrialProvider, useTrial } from '../hooks/useTrial';

function HomeContent() {
  const groups = getGroupedStrategies();
  const { isPremium, isTrial, daysRemaining, startTrial } = useTrial();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{STRATEGIES.length} Calculators</Text>
        </View>
        <Text style={styles.title}>Model your options trades</Text>
        <Text style={styles.titleAccent}>before you trade</Text>
        <Text style={styles.subtitle}>
          Visualize profit and loss for every major options strategy. All calculations run locally
          for instant results.
        </Text>
      </View>

      {!isPremium ? (
        <TouchableOpacity style={styles.trialCta} activeOpacity={0.8} onPress={startTrial}>
          <Text style={styles.trialTitle}>Try premium tools free for 7 days</Text>
          <Text style={styles.trialDesc}>
            Unlock Option Modeler, IV Screener, Income Analyzers, Roll Analyzer, and Trade Logger.
          </Text>
          <Text style={styles.trialBtn}>Start Free Trial →</Text>
        </TouchableOpacity>
      ) : isTrial ? (
        <View style={styles.trialBanner}>
          <Text style={styles.trialBannerText}>
            Premium trial — {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium Tools</Text>
        <View style={styles.grid}>
          {PREMIUM_FEATURES.map((feature) => (
            <Link key={feature.id} href={`/tools/${feature.id}` as `/tools/${string}`} asChild>
              <TouchableOpacity style={[styles.card, styles.premiumCard]} activeOpacity={0.75}>
                <View style={styles.premiumTitleRow}>
                  <Text style={styles.cardTitle}>{feature.name}</Text>
                  <Text style={styles.premiumBadge}>Premium</Text>
                </View>
                <Text style={styles.cardDescription}>{feature.description}</Text>
                <Text style={styles.cardArrow}>→</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
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

export default function HomeScreen() {
  return (
    <TrialProvider>
      <HomeContent />
    </TrialProvider>
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
  trialCta: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  trialTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  trialDesc: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  trialBtn: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  trialBanner: {
    backgroundColor: 'rgba(85, 207, 255, 0.08)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  trialBannerText: {
    color: colors.textMuted,
    fontSize: 13,
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
  premiumCard: {
    borderColor: 'rgba(85, 207, 255, 0.25)',
  },
  premiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 4,
  },
  premiumBadge: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(85, 207, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
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
