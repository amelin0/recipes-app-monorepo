import React from 'react';
import { Text, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DATES = [11, 12, 13, 14, 15, 16, 17];
const TODAY_IDX = 3;

interface MacroRowProps {
  label: string;
  current: number;
  total: number;
  color: string;
}

const MacroRow = ({ label, current, total, color }: MacroRowProps) => {
  const pct = current / total;
  return (
    <View style={styles.macroRow}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <View style={styles.macroInfo}>
        <View style={styles.macroLabelRow}>
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroValue}>
            {current}/{total}g
          </Text>
        </View>
        <View style={styles.macroTrack}>
          <View
            style={[styles.macroFill, { width: `${pct * 100}%` as any, backgroundColor: color }]}
          />
        </View>
      </View>
    </View>
  );
};

export const Slide2 = () => {
  return (
    <View style={styles.slide}>
      <Text style={styles.title}>Daily Tracking To Stay On Track</Text>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarMonth}>Dec 2025</Text>
          <View style={styles.calendarArrows}>
            <Text style={styles.calendarArrow}>‹</Text>
            <Text style={styles.calendarArrow}>›</Text>
          </View>
        </View>
        <View style={styles.calendarRow}>
          {DAYS.map((d, i) => (
            <View key={i} style={[styles.calendarDay, i === TODAY_IDX && styles.calendarDayActive]}>
              <Text
                style={[styles.calendarDayLabel, i === TODAY_IDX && styles.calendarDayLabelActive]}>
                {d}
              </Text>
              <Text style={[styles.calendarDayNum, i === TODAY_IDX && styles.calendarDayNumActive]}>
                {DATES[i]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.ringArea}>
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.ringNum}>670</Text>
              <Text style={styles.ringPct}>43%</Text>
            </View>
          </View>
          <Text style={styles.ringGoal}>Goal 1660</Text>
        </View>
        <View style={styles.macroList}>
          <MacroRow label="Proteins" current={45} total={165} color="#6B8F3C" />
          <MacroRow label="Carbs" current={78} total={140} color="#D4956A" />
          <MacroRow label="Fats" current={15} total={155} color="#5B9BD5" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create(({ colors }) => ({
  slide: { flex: 1, backgroundColor: colors.bg.canvas, paddingHorizontal: 24 },
  title: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 26,
    lineHeight: 34,
    color: colors.text.primary,
    letterSpacing: -0.28,
    marginTop: 8,
    marginBottom: 20,
  },
  calendarCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarMonth: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 14,
    color: colors.text.primary,
  },
  calendarArrows: { flexDirection: 'row', gap: 8 },
  calendarArrow: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 18,
    color: colors.text.secondary,
  },
  calendarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calendarDay: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  calendarDayActive: { backgroundColor: colors.primary.default },
  calendarDayLabel: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  calendarDayLabelActive: { color: colors.primary.onPrimary },
  calendarDayNum: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 14,
    color: colors.text.primary,
  },
  calendarDayNumActive: { color: colors.primary.onPrimary },
  progressCard: {
    backgroundColor: colors.bg.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ringArea: { alignItems: 'center', gap: 6 },
  ringOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 8,
    borderColor: colors.primary.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: { alignItems: 'center' },
  ringNum: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 22,
    color: colors.text.primary,
    lineHeight: 26,
  },
  ringPct: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  ringGoal: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  macroList: { flex: 1, gap: 10 },
  macroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroInfo: { flex: 1, gap: 4 },
  macroLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 12,
    color: colors.text.secondary,
  },
  macroValue: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 12,
    color: colors.text.primary,
  },
  macroTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.default,
    overflow: 'hidden',
  },
  macroFill: { height: 4, borderRadius: 2 },
}));
