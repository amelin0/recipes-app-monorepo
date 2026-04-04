import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

interface MacroSummaryRowProps {
  label: string;
  value: string;
  color: string;
}

const MacroSummaryRow = ({ label, value, color }: MacroSummaryRowProps) => {
  return (
    <View style={styles.macroSummaryRow}>
      <View style={[styles.macroSummaryBar, { backgroundColor: color }]} />
      <Text style={styles.macroSummaryValue}>{value}</Text>
      <Text style={styles.macroSummaryLabel}>{label}</Text>
    </View>
  );
};

interface StepperCardProps {
  label: string;
  value: number;
}

const StepperCard = ({ label, value }: StepperCardProps) => {
  return (
    <View style={styles.stepperCard}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepperBtn}>
          <Text style={styles.stepperBtnText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{value}</Text>
        <Pressable style={styles.stepperBtn}>
          <Text style={styles.stepperBtnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};

export const Slide3 = () => {
  return (
    <View style={styles.slide}>
      <View style={styles.foodImgCircle} />
      <Text style={styles.title}>Personalized{'\n'}Custom Plan</Text>
      <View style={styles.macroSummary}>
        <MacroSummaryRow label="Proteins" value="105g" color="#6B8F3C" />
        <MacroSummaryRow label="Carbs" value="130g" color="#D4956A" />
        <MacroSummaryRow label="Fat" value="12g" color="#EF4444" />
      </View>
      <View style={styles.stepperRow}>
        <StepperCard label="Daily Target" value={2000} />
        <StepperCard label="Daily Meals" value={3} />
      </View>
      <Text style={styles.sub}>Personal Meals, Your Way, Anytime.</Text>
      <Text style={styles.loginLink}>
        Already Have An Account? <Text style={styles.loginLinkBold}>Log In</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create(({ colors }) => ({
  slide: { flex: 1, backgroundColor: '#F5F0E8', paddingHorizontal: 24 },
  foodImgCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D4956A',
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.text.primary,
    letterSpacing: -0.28,
    marginBottom: 16,
  },
  macroSummary: { gap: 10, marginBottom: 20 },
  macroSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroSummaryBar: { width: 4, height: 20, borderRadius: 2 },
  macroSummaryValue: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 16,
    color: colors.text.primary,
    width: 56,
  },
  macroSummaryLabel: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 14,
    color: colors.text.secondary,
  },
  stepperRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stepperCard: {
    flex: 1,
    backgroundColor: colors.bg.canvas,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stepperLabel: {
    fontFamily: 'Figtree_500Medium',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 18,
    color: colors.text.primary,
    lineHeight: 22,
  },
  stepperValue: {
    fontFamily: 'Figtree_700Bold',
    fontSize: 18,
    color: colors.text.primary,
  },
  sub: {
    fontFamily: 'Figtree_600SemiBold',
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 12,
  },
  loginLink: {
    fontFamily: 'Figtree_400Regular',
    fontSize: 13,
    color: colors.text.secondary,
  },
  loginLinkBold: {
    fontFamily: 'Figtree_600SemiBold',
    color: colors.text.primary,
  },
}));
