import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '@/store';
import { reportsData } from '@/data';
import { screen, Section, KeyValueRow } from '@/components/Layout';
import { colors, radius, spacing, font, weight } from '@/theme';

const CHART_HEIGHT = 120;

export function ReportsScreen() {
  const { animals, ledger: financialRecords } = useApp();

  const active = animals.filter((a) => a.status === 'Active');
  const bySpecies = (['Cattle', 'Goats', 'Sheep'] as const).map((s) => ({
    label: s,
    count: active.filter((a) => a.species === s).length,
  }));

  const income = financialRecords.filter((r) => r.type === 'Income').reduce((s, r) => s + r.amount, 0);
  const expenses = financialRecords.filter((r) => r.type === 'Expense').reduce((s, r) => s + r.amount, 0);
  const net = income - expenses;

  const maxWeight = Math.max(...reportsData.weightTrend.map((w) => w.avgWeight));
  const maxMoney = Math.max(...reportsData.incomeExpenseData.flatMap((d) => [d.income, d.expenses]), 1);

  return (
    <ScrollView style={screen.container} contentContainerStyle={[screen.content, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>
      {/* Headline numbers */}
      <View style={[styles.stats, { marginTop: spacing.lg }]}>
        {[
          { label: 'Active animals', value: String(active.length) },
          { label: 'Daily gain', value: `+${reportsData.adg} kg` },
          { label: 'Vaccinated', value: `${reportsData.vaccinationCoverage}%` },
        ].map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Section title="Average weight (kg)">
        <View style={styles.chart}>
          {reportsData.weightTrend.map((w) => (
            <View key={w.month} style={styles.barCol}>
              <Text style={styles.barValue}>{w.avgWeight}</Text>
              <View style={[styles.bar, { height: (w.avgWeight / maxWeight) * (CHART_HEIGHT - 36) }]} />
              <Text style={styles.barLabel}>{w.month}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Income vs expenses">
        <View style={styles.chart}>
          {reportsData.incomeExpenseData.map((d) => (
            <View key={d.month} style={styles.barCol}>
              <View style={styles.barPair}>
                <View style={[styles.barThin, { height: (d.income / maxMoney) * (CHART_HEIGHT - 20), backgroundColor: colors.forest600 }]} />
                <View style={[styles.barThin, { height: (d.expenses / maxMoney) * (CHART_HEIGHT - 20), backgroundColor: colors.amber400 }]} />
              </View>
              <Text style={styles.barLabel}>{d.month}</Text>
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.forest600 }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.amber400 }]} />
            <Text style={styles.legendText}>Expenses</Text>
          </View>
        </View>
        <KeyValueRow
          label="Net margin (all records)"
          value={`${net < 0 ? '-' : '+'}$${Math.abs(net).toLocaleString()}`}
          valueColor={net < 0 ? colors.rust500 : colors.forest700}
        />
      </Section>

      <Section title="Breeding">
        <KeyValueRow first label="Calf survival" value={`${reportsData.calfSurvivalRate}% (${reportsData.calfSurvivalCount})`} />
        <KeyValueRow label="Weaning rate" value={`${reportsData.weaningRate}%`} />
        <KeyValueRow label="Average weaning weight" value={`${reportsData.avgWeaningWeight} kg`} />
      </Section>

      <Section title="Herd by species">
        {bySpecies.map((s, i) => (
          <KeyValueRow
            key={s.label}
            first={i === 0}
            label={s.label}
            value={`${s.count} · ${active.length ? Math.round((s.count / active.length) * 100) : 0}%`}
          />
        ))}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.charcoal200,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.charcoal200,
  },
  statValue: {
    fontSize: font.bodyLarge,
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  statLabel: {
    fontSize: font.caption,
    color: colors.charcoal500,
    marginTop: 2,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT + 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValue: {
    fontSize: font.label,
    color: colors.charcoal500,
  },
  bar: {
    width: 18,
    borderRadius: radius.xs,
    backgroundColor: colors.forest600,
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  barThin: {
    width: 9,
    borderRadius: 2,
  },
  barLabel: {
    fontSize: font.label,
    color: colors.charcoal500,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: font.caption,
    color: colors.charcoal500,
  },
});
