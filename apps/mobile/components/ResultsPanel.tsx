import type { CalculatorResult } from '@ai-options/core';
import { StyleSheet, Text, View } from 'react-native';
import { MetricCard } from './MetricCard';
import { colors, spacing } from '../constants/theme';

function formatMoney(value: number | 'unlimited'): string {
  if (value === 'unlimited') return 'Unlimited';
  const prefix = value >= 0 ? '$' : '-$';
  return `${prefix}${Math.abs(value).toFixed(2)}`;
}

interface ResultsPanelProps {
  result: CalculatorResult | null;
}

export function ResultsPanel({ result }: ResultsPanelProps) {
  if (!result) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Enter parameters and tap Calculate to see results.</Text>
      </View>
    );
  }

  const { metrics } = result;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Key Metrics</Text>
      <View style={styles.grid}>
        <MetricCard label="Max Profit" value={formatMoney(metrics.maxProfit)} tone="profit" />
        <MetricCard label="Max Loss" value={formatMoney(metrics.maxLoss)} tone="loss" />
        <MetricCard label="Premium" value={`$${metrics.premium.toFixed(2)}`} />
        <MetricCard
          label="Breakeven"
          value={
            metrics.breakevens.length
              ? metrics.breakevens.map((b) => `$${b.toFixed(2)}`).join(' / ')
              : 'N/A'
          }
        />
      </View>
      {result.greeks ? (
        <View style={styles.greeks}>
          <Text style={styles.subtitle}>Greeks</Text>
          <View style={styles.grid}>
            <MetricCard label="Delta" value={result.greeks.delta.toFixed(3)} />
            <MetricCard label="Gamma" value={result.greeks.gamma.toFixed(4)} />
            <MetricCard label="Theta" value={result.greeks.theta.toFixed(3)} />
            <MetricCard label="Vega" value={result.greeks.vega.toFixed(3)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  greeks: {
    gap: spacing.sm,
  },
  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
