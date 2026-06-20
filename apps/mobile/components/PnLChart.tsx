import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import type { PnLPoint } from '@ai-options/core';
import { colors, spacing } from '../constants/theme';

interface PnLChartProps {
  data: PnLPoint[];
  currentPrice?: number;
  height?: number;
}

export function PnLChart({ data, currentPrice, height = 220 }: PnLChartProps) {
  if (data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.empty}>Calculate to see P/L chart</Text>
      </View>
    );
  }

  const width = Dimensions.get('window').width - spacing.lg * 2;
  const padding = { top: 16, right: 12, bottom: 28, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const prices = data.map((d) => d.stockPrice);
  const pnls = data.map((d) => d.pnl);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minPnl = Math.min(...pnls, 0);
  const maxPnl = Math.max(...pnls, 0);
  const pnlRange = maxPnl - minPnl || 1;
  const priceRange = maxPrice - minPrice || 1;

  const x = (price: number) =>
    padding.left + ((price - minPrice) / priceRange) * chartWidth;
  const y = (pnl: number) =>
    padding.top + chartHeight - ((pnl - minPnl) / pnlRange) * chartHeight;

  const path = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.stockPrice)} ${y(point.pnl)}`)
    .join(' ');

  const zeroY = y(0);
  const currentX = currentPrice !== undefined ? x(currentPrice) : null;

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        <Line
          x1={padding.left}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          stroke={colors.border}
          strokeDasharray="4 4"
        />
        {currentX !== null ? (
          <Line
            x1={currentX}
            y1={padding.top}
            x2={currentX}
            y2={height - padding.bottom}
            stroke={colors.primary}
            strokeOpacity={0.5}
          />
        ) : null}
        <Path d={path} stroke={colors.primary} strokeWidth={2.5} fill="none" />
        {currentX !== null ? (
          <Circle cx={currentX} cy={zeroY} r={4} fill={colors.primary} />
        ) : null}
        <SvgText
          x={padding.left}
          y={height - 8}
          fill={colors.textMuted}
          fontSize="11"
        >
          ${minPrice.toFixed(0)}
        </SvgText>
        <SvgText
          x={width - padding.right - 24}
          y={height - 8}
          fill={colors.textMuted}
          fontSize="11"
        >
          ${maxPrice.toFixed(0)}
        </SvgText>
        <SvgText
          x={8}
          y={padding.top + 4}
          fill={colors.textMuted}
          fontSize="11"
        >
          ${maxPnl.toFixed(0)}
        </SvgText>
        <SvgText
          x={8}
          y={height - padding.bottom}
          fill={colors.textMuted}
          fontSize="11"
        >
          ${minPnl.toFixed(0)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  empty: {
    color: colors.textMuted,
    textAlign: 'center',
  },
});
