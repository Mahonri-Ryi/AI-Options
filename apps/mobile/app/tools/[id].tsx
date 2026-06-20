import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  DEMO_TRADES,
  getPremiumFeatureById,
  screenIvUniverse,
  summarizeTrades,
} from '@ai-options/core';
import { colors, radius, spacing } from '../../constants/theme';
import { TrialProvider, useTrial } from '../../hooks/useTrial';

function ToolContent() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const feature = getPremiumFeatureById(id);
  const { isPremium, startTrial } = useTrial();

  if (!feature) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Tool not found.</Text>
      </View>
    );
  }

  if (!isPremium) {
    return (
      <View style={styles.gate}>
        <Text style={styles.gateIcon}>★</Text>
        <Text style={styles.gateTitle}>{feature.name}</Text>
        <Text style={styles.gateDesc}>
          Start a free 7-day trial to unlock all premium tools.
        </Text>
        <TouchableOpacity style={styles.gateBtn} onPress={startTrial}>
          <Text style={styles.gateBtnText}>Start Free Trial →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (id === 'iv-screener') {
    const rows = screenIvUniverse({ minIvRank: 50, sortBy: 'ivRank', sortDir: 'desc' }).slice(0, 8);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>{feature.description}</Text>
        {rows.map((row) => (
          <View key={row.symbol} style={styles.row}>
            <Text style={styles.rowTitle}>{row.symbol}</Text>
            <Text style={styles.rowMeta}>
              IV Rank {row.ivRank} · IV {row.iv30.toFixed(1)}% · HV20 {row.hv20.toFixed(1)}%
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  if (id === 'trade-logger') {
    const summary = summarizeTrades(DEMO_TRADES);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>{feature.description}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryItem}>Open: {summary.openCount}</Text>
          <Text style={styles.summaryItem}>Closed: {summary.closedCount}</Text>
          <Text style={styles.summaryItem}>P/L: ${summary.realizedPnl.toFixed(2)}</Text>
        </View>
        {summary.trades.map((trade) => (
          <View key={trade.id} style={styles.row}>
            <Text style={styles.rowTitle}>
              {trade.symbol} — {trade.strategy}
            </Text>
            <Text style={styles.rowMeta}>
              {trade.status} · Entry ${trade.entryPremium.toFixed(2)}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.desc}>{feature.description}</Text>
      <Text style={styles.rowMeta}>
        Full {feature.name} UI is available in the web app. Highlights:{' '}
        {feature.highlights.join(', ')}.
      </Text>
    </ScrollView>
  );
}

export default function ToolScreen() {
  return (
    <TrialProvider>
      <ToolContent />
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
    gap: spacing.sm,
  },
  desc: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.loss,
    padding: spacing.lg,
  },
  gate: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  gateIcon: {
    fontSize: 40,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  gateTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  gateDesc: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  gateBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  gateBtnText: {
    color: '#0a0a0a',
    fontWeight: '700',
    fontSize: 15,
  },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryItem: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
