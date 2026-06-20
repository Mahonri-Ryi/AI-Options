import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NumberField } from '../../components/NumberField';
import { PnLChart } from '../../components/PnLChart';
import { ResultsPanel } from '../../components/ResultsPanel';
import { colors, spacing } from '../../constants/theme';
import { CALCULATOR_CONFIGS, useCalculator } from '../../hooks/useCalculator';

export default function CalculatorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const configId = id ?? 'long-call';
  const { config, values, updateValue, calculate, result } = useCalculator(configId);

  useEffect(() => {
    if (config) {
      calculate();
    }
  }, []);

  if (!config) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Calculator not found.</Text>
      </View>
    );
  }

  const stockPrice = Number(values.stockPrice) || 0;

  return (
    <>
      <Stack.Screen options={{ title: config.title }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Parameters</Text>
            <View style={styles.fieldGrid}>
              {config.fields.map((field) => (
                <NumberField
                  key={field.key}
                  label={field.label}
                  value={values[field.key] ?? field.defaultValue}
                  onChange={(value) => updateValue(field.key, value)}
                  suffix={field.suffix}
                />
              ))}
            </View>
            <Pressable style={styles.button} onPress={calculate}>
              <Text style={styles.buttonText}>Calculate P/L</Text>
            </Pressable>
          </View>

          <ResultsPanel result={result} />

          {result && result.curve.length > 1 ? (
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>
                {configId === 'theta-decay' ? 'Theta Decay' : 'P/L at Expiration'}
              </Text>
              <PnLChart data={result.curve} currentPrice={stockPrice} />
            </View>
          ) : null}

          {configId === 'implied-volatility' && result ? (
            <View style={styles.highlight}>
              <Text style={styles.highlightLabel}>Implied Volatility</Text>
              <Text style={styles.highlightValue}>{result.metrics.premium.toFixed(2)}%</Text>
            </View>
          ) : null}

          {configId === 'expected-move' && result ? (
            <View style={styles.grid}>
              <View style={styles.moveCard}>
                <Text style={styles.moveLabel}>Expected Down</Text>
                <Text style={styles.moveValue}>
                  ${typeof result.metrics.maxLoss === 'number' ? result.metrics.maxLoss.toFixed(2) : '—'}
                </Text>
              </View>
              <View style={styles.moveCard}>
                <Text style={styles.moveLabel}>Expected Up</Text>
                <Text style={styles.moveValue}>
                  ${typeof result.metrics.maxProfit === 'number' ? result.metrics.maxProfit.toFixed(2) : '—'}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  error: {
    color: colors.loss,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
  },
  formTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '700',
  },
  chartSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  highlight: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
  },
  highlightLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  highlightValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  moveCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
  },
  moveLabel: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  moveValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
});
