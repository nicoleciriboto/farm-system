import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, radius, spacing, font, weight } from '@/theme';
import { useApp } from '@/store';
import { useTabBarSpace } from '@/components/NativeTabBar';
import { Button, Modal, Input, Select } from '@/components/NativeUI';
import { screen, ScreenTitle, Section, ListRow, KeyValueRow, BottomBar, type IoniconName } from '@/components/Layout';
import { today } from '@/data';
import { WorkerForm } from '@/components/WorkerForm';
import type { InventoryItem, LivestockEvent, SalaryPayment, SalaryPaymentMethod } from '@/types';
import { formatShortDate, monthLabel, recentMonths, isIsoDate } from '@/utils';

export type OperationsSection = 'finance' | 'salaries' | 'sales' | 'inventory' | 'events';

export const operationsSectionTitles: Record<OperationsSection, string> = {
  finance: 'Finance',
  salaries: 'Salaries',
  sales: 'Trading',
  inventory: 'Inventory',
  events: 'Life events',
};

const money = (n: number) => `$${Math.abs(n).toLocaleString()}`;

// ================= OPERATIONS TAB (overview) =================
export function OperationsScreen() {
  const { inventory, ledger: financialRecords, salaryPayments, transactions, events, navigate } = useApp();
  const tabBarSpace = useTabBarSpace(); // keep content clear of the floating tab bar

  const income = financialRecords.filter((r) => r.type === 'Income').reduce((s, r) => s + r.amount, 0);
  const expenses = financialRecords.filter((r) => r.type === 'Expense').reduce((s, r) => s + r.amount, 0);
  const net = income - expenses;
  const lowStock = inventory.filter((i) => i.quantity <= i.reorderThreshold).length;
  const thisMonth = today.slice(0, 7);
  const monthName = monthLabel(thisMonth).split(' ')[0];
  const salariesThisMonth = salaryPayments.filter((p) => p.date.startsWith(thisMonth));
  const salariesTotal = salariesThisMonth.reduce((s, p) => s + p.amount, 0);
  const workersPaid = new Set(salariesThisMonth.map((p) => p.workerName)).size;

  const open = (section: OperationsSection) => navigate('operationsSection', { operationsTab: section });

  const rows: { section?: OperationsSection; icon: IoniconName; title: string; subtitle: string; warn?: boolean }[] = [
    { section: 'finance', icon: 'cash-outline', title: 'Finance', subtitle: `${financialRecords.length} ledger entries` },
    {
      section: 'salaries',
      icon: 'people-outline',
      title: 'Salaries',
      subtitle: salariesThisMonth.length
        ? `${money(salariesTotal)} paid in ${monthName} · ${workersPaid} ${workersPaid === 1 ? 'worker' : 'workers'}`
        : `No wages paid yet in ${monthName}`,
    },
    { section: 'sales', icon: 'cart-outline', title: 'Trading', subtitle: `${transactions.length} sales & purchases` },
    {
      section: 'inventory',
      icon: 'cube-outline',
      title: 'Inventory',
      subtitle: lowStock > 0 ? `${lowStock} items running low` : `${inventory.length} items in stock`,
      warn: lowStock > 0,
    },
    { section: 'events', icon: 'swap-horizontal-outline', title: 'Life events', subtitle: `${events.length} transfers, births & deaths` },
  ];

  return (
    <ScrollView style={screen.container} contentContainerStyle={[screen.content, { paddingBottom: tabBarSpace }]} showsVerticalScrollIndicator={false}>
      <ScreenTitle title="Operations" subtitle="Money, stock and herd movements" />

      {/* Financial summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Net margin</Text>
        <Text style={[styles.summaryValue, net < 0 && { color: colors.rust500 }]}>
          {net < 0 ? '-' : '+'}
          {money(net)}
        </Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryMeta}>
            Income <Text style={styles.summaryMetaValue}>{money(income)}</Text>
          </Text>
          <Text style={styles.summaryMeta}>
            Expenses <Text style={styles.summaryMetaValue}>{money(expenses)}</Text>
          </Text>
        </View>
      </View>

      <Section title="Manage">
        {rows.map((r, i) => (
          <ListRow
            key={r.title}
            first={i === 0}
            leftIcon={r.icon}
            leftIconColor={r.warn ? colors.amber600 : colors.forest700}
            title={r.title}
            subtitle={r.subtitle}
            subtitleColor={r.warn ? colors.amber700 : undefined}
            onPress={() => r.section && open(r.section)}
          />
        ))}
      </Section>

      <Section title="Insights">
        <ListRow
          first
          leftIcon="bar-chart-outline"
          title="Farm performance"
          subtitle="Growth, breeding, health and financial trends"
          onPress={() => navigate('reports')}
        />
      </Section>
    </ScrollView>
  );
}

// ================= SECTION SCREEN (pushed from the overview) =================
export function OperationsSectionScreen() {
  const { operationsTab } = useApp();
  const section = (operationsTab in operationsSectionTitles ? operationsTab : 'finance') as OperationsSection;
  if (section === 'salaries') return <SalariesSection />;
  if (section === 'sales') return <TradingSection />;
  if (section === 'inventory') return <InventorySection />;
  if (section === 'events') return <EventsSection />;
  return <FinanceSection />;
}

function SectionPage({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={screen.container} contentContainerStyle={[screen.content, { paddingTop: 0 }]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {action ? <BottomBar>{action}</BottomBar> : null}
    </View>
  );
}

function ModalFooter({ onCancel, onSave, saveLabel = 'Save' }: { onCancel: () => void; onSave: () => void; saveLabel?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <Button variant="outline" onPress={onCancel} style={{ flex: 1 }}>
        Cancel
      </Button>
      <Button variant="primary" onPress={onSave} style={{ flex: 1 }}>
        {saveLabel}
      </Button>
    </View>
  );
}

// ---------- Finance ----------
function FinanceSection() {
  const { ledger: financialRecords, addFinancialRecord, navigate } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<'Expense' | 'Income'>('Expense');
  const [category, setCategory] = useState('Feed & Nutrition');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!(Number(amount) > 0)) return setError('Enter an amount greater than 0');
    addFinancialRecord({ type, category, amount: Number(amount), date: today, paymentMethod: 'Cash', notes: `${category} logged` });
    setError('');
    setShowAdd(false);
    setAmount('');
  };

  return (
    <SectionPage
      action={
        <Button variant="primary" onPress={() => setShowAdd(true)} style={{ flex: 1 }}>
          Add entry
        </Button>
      }
    >
      <Section title="Ledger">
        {financialRecords.map((r, i) => (
          <ListRow
            key={r.id}
            first={i === 0}
            leftIcon={r.type === 'Income' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
            leftIconColor={r.type === 'Income' ? colors.forest600 : colors.amber600}
            title={r.category}
            subtitle={`${formatShortDate(r.date)} ${r.date.slice(0, 4)} · ${r.paymentMethod}`}
            onPress={r.salaryPaymentId ? () => navigate('operationsSection', { operationsTab: 'salaries' }) : undefined}
            right={
              <Text style={[styles.amount, { color: r.type === 'Income' ? colors.forest700 : colors.charcoal700 }]}>
                {r.type === 'Income' ? '+' : '-'}
                {money(r.amount)}
              </Text>
            }
          />
        ))}
      </Section>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add entry" footer={<ModalFooter onCancel={() => setShowAdd(false)} onSave={handleAdd} />}>
        <Select
          label="Type"
          value={type}
          onSelect={(v) => setType(v as 'Expense' | 'Income')}
          options={[
            { value: 'Expense', label: 'Expense' },
            { value: 'Income', label: 'Income' },
          ]}
          required
        />
        <Select
          label="Category"
          value={category}
          onSelect={setCategory}
          options={['Feed & Nutrition', 'Veterinary Care & Drugs', 'Equipment & Fencing', 'Transport', 'Livestock Sales'].map((c) => ({
            value: c,
            label: c,
          }))}
          required
        />
        <Input label="Amount (USD)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="250" required error={error || undefined} />
        <Text style={styles.hint}>Paying a worker? Use Operations → Salaries so each payment is tracked per person.</Text>
      </Modal>
    </SectionPage>
  );
}

// ---------- Salaries ----------
const PAY_METHODS: { value: SalaryPaymentMethod; label: string }[] = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Mobile Money', label: 'Mobile money (EcoCash)' },
  { value: 'Bank Transfer', label: 'Bank transfer' },
];
const CASUAL = 'casual';

function SalariesSection() {
  const { salaryPayments, addSalaryPayment, deleteSalaryPayment, team } = useApp();
  const payees = team.filter((m) => m.role !== 'Farm Owner');
  const [showAddWorker, setShowAddWorker] = useState(false);
  const thisMonth = today.slice(0, 7);

  const [showPay, setShowPay] = useState(false);
  const [workerId, setWorkerId] = useState('');
  const [casualName, setCasualName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [period, setPeriod] = useState(thisMonth);
  const [method, setMethod] = useState<SalaryPaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selected = salaryPayments.find((p) => p.id === selectedId) || null;

  const sorted = [...salaryPayments].sort((a, b) => b.date.localeCompare(a.date));
  const paidThisMonth = sorted.filter((p) => p.date.startsWith(thisMonth));
  const paidThisYear = sorted.filter((p) => p.date.startsWith(today.slice(0, 4)));
  const sum = (list: SalaryPayment[]) => list.reduce((s, p) => s + p.amount, 0);

  // History grouped by the month the money was paid
  const groups = sorted.reduce<{ month: string; items: SalaryPayment[] }[]>((acc, p) => {
    const month = p.date.slice(0, 7);
    const g = acc.find((x) => x.month === month);
    if (g) g.items.push(p);
    else acc.push({ month, items: [p] });
    return acc;
  }, []);

  const lastPaymentFor = (id: string) => sorted.find((p) => p.workerId === id);

  const openPay = (preselectId?: string) => {
    const last = preselectId ? lastPaymentFor(preselectId) : undefined;
    const usual = payees.find((m) => m.id === preselectId)?.monthlySalary;
    setWorkerId(preselectId ?? '');
    setCasualName('');
    setAmount(last ? String(last.amount) : usual ? String(usual) : '');
    setDate(today);
    setPeriod(thisMonth);
    setMethod(last?.method ?? 'Cash');
    setNotes('');
    setErrors({});
    setShowPay(true);
  };

  const payee = payees.find((m) => m.id === workerId);
  const payeeName = workerId === CASUAL ? casualName.trim() : payee?.name ?? '';
  const alreadyPaid = payee ? salaryPayments.filter((p) => p.workerId === payee.id && p.period === period) : [];

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!workerId) errs.worker = 'Choose who was paid';
    if (workerId === CASUAL && !casualName.trim()) errs.name = 'Enter the name of the worker';
    if (!(Number(amount) > 0)) errs.amount = 'Enter an amount greater than 0';
    if (!isIsoDate(date)) errs.date = 'Use the format YYYY-MM-DD';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    addSalaryPayment({
      workerId: payee?.id,
      workerName: payeeName,
      workerRole: payee?.role ?? 'Casual worker',
      amount: Number(amount),
      date,
      period,
      method,
      notes: notes.trim() || undefined,
    });
    setShowPay(false);
  };

  const closeDetail = () => {
    setSelectedId(null);
    setConfirmDelete(false);
  };

  return (
    <SectionPage
      action={
        <Button variant="primary" onPress={() => openPay()} style={{ flex: 1 }}>
          Record payment
        </Button>
      }
    >
      <View style={[styles.summary, { marginTop: spacing.lg }]}>
        <Text style={styles.summaryLabel}>Paid in {monthLabel(thisMonth)}</Text>
        <Text style={[styles.summaryValue, { color: colors.charcoal800 }]}>{money(sum(paidThisMonth))}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryMeta}>
            This year <Text style={styles.summaryMetaValue}>{money(sum(paidThisYear))}</Text>
          </Text>
          <Text style={styles.summaryMeta}>
            Payments <Text style={styles.summaryMetaValue}>{paidThisYear.length}</Text>
          </Text>
        </View>
      </View>

      <Section title="Workers" action="Add worker" onAction={() => setShowAddWorker(true)}>
        {payees.length === 0 && <ListRow first title="No workers yet" subtitle="Add the people you pay" chevron={false} />}
        {payees.map((m, i) => {
          const last = lastPaymentFor(m.id);
          return (
            <ListRow
              key={m.id}
              first={i === 0}
              leftIcon="person-circle-outline"
              title={m.name}
              subtitle={
                last ? `${m.role} · last paid ${formatShortDate(last.date)} for ${monthLabel(last.period)}` : `${m.role} · no payments yet`
              }
              right={last ? money(last.amount) : undefined}
              numberOfLines={2}
              onPress={() => openPay(m.id)}
            />
          );
        })}
      </Section>

      {groups.length === 0 ? (
        <Section title="History">
          <ListRow first title="No salary payments yet" chevron={false} />
        </Section>
      ) : (
        groups.map((g) => (
          <Section key={g.month} title={`${monthLabel(g.month)} · ${money(sum(g.items))}`}>
            {g.items.map((p, i) => (
              <ListRow
                key={p.id}
                first={i === 0}
                leftIcon="wallet-outline"
                title={p.workerName}
                subtitle={`${formatShortDate(p.date)} · for ${monthLabel(p.period)} · ${p.method}`}
                right={money(p.amount)}
                numberOfLines={2}
                onPress={() => setSelectedId(p.id)}
              />
            ))}
          </Section>
        ))
      )}

      <WorkerForm open={showAddWorker} onClose={() => setShowAddWorker(false)} />

      {/* Record a payment */}
      <Modal
        open={showPay}
        onClose={() => setShowPay(false)}
        title="Record salary payment"
        footer={<ModalFooter onCancel={() => setShowPay(false)} onSave={handleSave} saveLabel="Save payment" />}
      >
        <Select
          label="Paid to"
          value={workerId}
          onSelect={(v) => {
            setWorkerId(v);
            const usual = lastPaymentFor(v)?.amount ?? payees.find((m) => m.id === v)?.monthlySalary;
            if (usual && !amount) setAmount(String(usual));
          }}
          placeholder="Choose a worker"
          options={[
            ...payees.map((m) => ({ value: m.id, label: `${m.name} (${m.role})` })),
            { value: CASUAL, label: 'Casual / other worker' },
          ]}
          required
          error={errors.worker}
        />
        {workerId === CASUAL && (
          <Input label="Worker name" value={casualName} onChangeText={setCasualName} placeholder="e.g. Tafadzwa Ncube" required error={errors.name} />
        )}
        <Input label="Amount (USD)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="e.g. 200" required error={errors.amount} />
        <Input label="Date paid" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" required error={errors.date} />
        <Select
          label="Pay for month"
          value={period}
          onSelect={setPeriod}
          options={recentMonths(today, 6).map((m) => ({ value: m, label: monthLabel(m) }))}
          required
        />
        {alreadyPaid.length > 0 && (
          <Text style={styles.warning}>
            {payee?.name} was already paid {money(sum(alreadyPaid))} for {monthLabel(period)}. Save again only for an extra payment such as a bonus.
          </Text>
        )}
        <Select label="Payment method" value={method} onSelect={(v) => setMethod(v as SalaryPaymentMethod)} options={PAY_METHODS} required />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="e.g. includes overtime" optional />
      </Modal>

      {/* Payment details */}
      <Modal
        open={!!selected}
        onClose={closeDetail}
        title={selected?.workerName ?? 'Payment'}
        footer={
          confirmDelete ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.confirmText}>Delete this payment? It will also be removed from the Finance ledger.</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button variant="outline" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }}>
                  Keep
                </Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    if (selected) deleteSalaryPayment(selected.id);
                    closeDetail();
                  }}
                  style={{ flex: 1 }}
                >
                  Delete
                </Button>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button variant="outline" onPress={() => setConfirmDelete(true)} style={{ flex: 1 }}>
                Delete
              </Button>
              <Button variant="primary" onPress={closeDetail} style={{ flex: 1 }}>
                Done
              </Button>
            </View>
          )
        }
      >
        {selected && (
          <View style={styles.modalGroup}>
            <KeyValueRow first label="Amount" value={money(selected.amount)} />
            <KeyValueRow label="Role" value={selected.workerRole} />
            <KeyValueRow label="Paid on" value={`${formatShortDate(selected.date)} ${selected.date.slice(0, 4)}`} />
            <KeyValueRow label="For month" value={monthLabel(selected.period)} />
            <KeyValueRow label="Method" value={selected.method} />
            {selected.notes ? <KeyValueRow label="Notes" value={selected.notes} /> : null}
            <KeyValueRow label="Recorded by" value={selected.recordedBy} />
          </View>
        )}
      </Modal>
    </SectionPage>
  );
}

// ---------- Trading ----------
function TradingSection() {
  const { transactions, animals, recordSale } = useApp();
  const [showSale, setShowSale] = useState(false);
  const [animalId, setAnimalId] = useState('');
  const [buyer, setBuyer] = useState('Gweru Quality Meats');
  const [price, setPrice] = useState('1450');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSale = () => {
    const errs: Record<string, string> = {};
    if (!animalId) errs.animal = 'Choose the animal being sold';
    if (!buyer.trim()) errs.buyer = 'Buyer is required';
    if (!(Number(price) > 0)) errs.price = 'Enter a price greater than 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    recordSale(animalId, buyer.trim(), Number(price));
    setAnimalId('');
    setShowSale(false);
  };

  return (
    <SectionPage
      action={
        <Button variant="primary" onPress={() => setShowSale(true)} style={{ flex: 1 }}>
          Record a sale
        </Button>
      }
    >
      <Section title="History">
        {transactions.map((t, i) => (
          <ListRow
            key={t.id}
            first={i === 0}
            leftIcon={t.type === 'Sale' ? 'pricetag-outline' : 'cart-outline'}
            leftIconColor={t.type === 'Sale' ? colors.forest600 : colors.amber600}
            title={`${t.type} · ${t.counterparty}`}
            subtitle={`${formatShortDate(t.date)} ${t.date.slice(0, 4)} · ${t.quantity} animal${t.quantity === 1 ? '' : 's'}`}
            right={
              <Text style={[styles.amount, { color: t.type === 'Sale' ? colors.forest700 : colors.charcoal700 }]}>
                {t.type === 'Sale' ? '+' : '-'}
                {money(t.totalValue)}
              </Text>
            }
          />
        ))}
      </Section>

      <Modal open={showSale} onClose={() => setShowSale(false)} title="Record a sale" footer={<ModalFooter onCancel={() => setShowSale(false)} onSave={handleSale} />}>
        <Select
          label="Animal"
          value={animalId}
          onSelect={setAnimalId}
          placeholder="Choose an active animal"
          options={animals
            .filter((a) => a.status === 'Active')
            .map((a) => ({ value: a.id, label: `${a.name || a.id} (${a.earTag}) - ${a.breed}` }))}
          required
          error={errors.animal}
        />
        <Input label="Buyer" value={buyer} onChangeText={setBuyer} placeholder="Buyer name" required error={errors.buyer} />
        <Input label="Price (USD)" value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="1450" required error={errors.price} />
      </Modal>
    </SectionPage>
  );
}

// ---------- Inventory ----------
const INVENTORY_CATEGORIES: InventoryItem['category'][] = ['Veterinary Medicine', 'Feed', 'Equipment', 'Other'];

function InventorySection() {
  const { inventory, recordStockUsage, restockInventory, saveInventoryItem, deleteInventoryItem, showToast } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState('1');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const item = inventory.find((i) => i.id === selectedId) || null;

  // Add / edit form
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fName, setFName] = useState('');
  const [fCategory, setFCategory] = useState<InventoryItem['category']>('Veterinary Medicine');
  const [fUnit, setFUnit] = useState('');
  const [fQty, setFQty] = useState('');
  const [fReorder, setFReorder] = useState('');
  const [fSupplier, setFSupplier] = useState('');
  const [fExpiry, setFExpiry] = useState('');
  const [fErrors, setFErrors] = useState<Record<string, string>>({});

  const isLow = (i: InventoryItem) => i.quantity <= i.reorderThreshold;
  const low = inventory.filter(isLow);
  const ok = inventory.filter((i) => !isLow(i));

  const openItem = (i: InventoryItem) => {
    setSelectedId(i.id);
    setQty('1');
    setConfirmDelete(false);
  };

  const openForm = (existing?: InventoryItem) => {
    setEditingId(existing?.id ?? null);
    setFName(existing?.name ?? '');
    setFCategory(existing?.category ?? 'Veterinary Medicine');
    setFUnit(existing?.unit ?? '');
    setFQty(existing ? String(existing.quantity) : '');
    setFReorder(existing ? String(existing.reorderThreshold) : '');
    setFSupplier(existing?.supplier ?? '');
    setFExpiry(existing?.expiryDate ?? '');
    setFErrors({});
    setFormOpen(true);
  };

  const editSelected = () => {
    const current = item;
    setSelectedId(null);
    // iOS can't present a new modal while the previous one is still animating out
    setTimeout(() => current && openForm(current), Platform.OS === 'ios' ? 350 : 0);
  };

  const saveForm = () => {
    const errs: Record<string, string> = {};
    if (!fName.trim()) errs.name = 'Enter the item name';
    if (!fUnit.trim()) errs.unit = 'e.g. bottles, kg, bags';
    if (fQty === '' || !(Number(fQty) >= 0)) errs.qty = 'Enter how many you have (0 or more)';
    if (fReorder === '' || !(Number(fReorder) >= 0)) errs.reorder = 'Enter the level that should trigger a reorder';
    if (fExpiry && !isIsoDate(fExpiry)) errs.expiry = 'Use the format YYYY-MM-DD';
    setFErrors(errs);
    if (Object.keys(errs).length > 0) return;
    saveInventoryItem({
      id: editingId ?? undefined,
      name: fName.trim(),
      category: fCategory,
      unit: fUnit.trim(),
      quantity: Number(fQty),
      reorderThreshold: Number(fReorder),
      supplier: fSupplier.trim() || 'Not set',
      expiryDate: fExpiry || undefined,
    });
    setFormOpen(false);
  };

  const use = () => {
    if (!item) return;
    const n = Number(qty);
    if (!(n > 0)) return showToast('Enter a quantity greater than 0', 'error');
    if (n > item.quantity) return showToast(`Only ${item.quantity} ${item.unit} in stock`, 'error');
    recordStockUsage(item.id, n, 'Field use');
    setSelectedId(null);
  };

  const restock = () => {
    if (!item) return;
    const n = Number(qty);
    if (!(n > 0)) return showToast('Enter a quantity greater than 0', 'error');
    restockInventory(item.id, n);
    setSelectedId(null);
  };

  const renderRow = (i: InventoryItem, idx: number) => (
    <ListRow
      key={i.id}
      first={idx === 0}
      leftIcon="cube-outline"
      leftIconColor={isLow(i) ? colors.amber600 : colors.forest700}
      title={i.name}
      subtitle={`${i.quantity} ${i.unit} · reorder at ${i.reorderThreshold}`}
      subtitleColor={isLow(i) ? colors.amber700 : undefined}
      onPress={() => openItem(i)}
    />
  );

  return (
    <SectionPage
      action={
        <Button variant="primary" onPress={() => openForm()} style={{ flex: 1 }}>
          Add item
        </Button>
      }
    >
      {inventory.length === 0 && (
        <Section title="Inventory">
          <ListRow first title="No items yet" subtitle="Add medicines, feed and equipment you keep in store" chevron={false} />
        </Section>
      )}
      {low.length > 0 && <Section title="Running low">{low.map(renderRow)}</Section>}
      {ok.length > 0 && <Section title="In stock">{ok.map(renderRow)}</Section>}

      {/* Item sheet: use / restock / edit / delete */}
      <Modal
        open={!!item}
        onClose={() => setSelectedId(null)}
        title={item?.name || 'Stock'}
        footer={
          confirmDelete ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={styles.confirmText}>Delete {item?.name} and its stock history?</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Button variant="outline" onPress={() => setConfirmDelete(false)} style={{ flex: 1 }}>
                  Keep
                </Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    if (item) deleteInventoryItem(item.id);
                    setSelectedId(null);
                  }}
                  style={{ flex: 1 }}
                >
                  Delete
                </Button>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button variant="outline" onPress={use} style={{ flex: 1 }}>
                Use
              </Button>
              <Button variant="primary" onPress={restock} style={{ flex: 1 }}>
                Restock
              </Button>
            </View>
          )
        }
      >
        {item && (
          <>
            <View style={styles.modalGroup}>
              <KeyValueRow first label="In stock" value={`${item.quantity} ${item.unit}`} />
              <KeyValueRow label="Reorder at" value={`${item.reorderThreshold} ${item.unit}`} />
              <KeyValueRow label="Category" value={item.category} />
              <KeyValueRow label="Supplier" value={item.supplier} />
              {item.expiryDate ? <KeyValueRow label="Expires" value={`${formatShortDate(item.expiryDate)} ${item.expiryDate.slice(0, 4)}`} /> : null}
            </View>
            <Input label={`Quantity to use or restock (${item.unit})`} value={qty} onChangeText={setQty} keyboardType="numeric" placeholder="1" />
            {!confirmDelete && (
              <View style={styles.linkRow}>
                <TouchableOpacity onPress={editSelected} hitSlop={8}>
                  <Text style={styles.linkText}>Edit item</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setConfirmDelete(true)} hitSlop={8}>
                  <Text style={[styles.linkText, { color: colors.rust500 }]}>Delete item</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </Modal>

      {/* Add / edit item */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingId ? 'Edit item' : 'Add inventory item'}
        footer={<ModalFooter onCancel={() => setFormOpen(false)} onSave={saveForm} saveLabel={editingId ? 'Save' : 'Add item'} />}
      >
        <Input label="Item name" value={fName} onChangeText={setFName} placeholder="e.g. Ivermectin injection" required error={fErrors.name} />
        <Select
          label="Category"
          value={fCategory}
          onSelect={(v) => setFCategory(v as InventoryItem['category'])}
          options={INVENTORY_CATEGORIES.map((c) => ({ value: c, label: c }))}
          required
        />
        <Input label="Unit" value={fUnit} onChangeText={setFUnit} placeholder="e.g. bottles, kg, bags" required error={fErrors.unit} />
        <Input
          label={editingId ? 'Quantity in stock' : 'Opening stock'}
          value={fQty}
          onChangeText={setFQty}
          keyboardType="numeric"
          placeholder="e.g. 10"
          required
          error={fErrors.qty}
        />
        <Input
          label="Reorder when stock falls to"
          value={fReorder}
          onChangeText={setFReorder}
          keyboardType="numeric"
          placeholder="e.g. 3"
          required
          error={fErrors.reorder}
        />
        <Input label="Supplier" value={fSupplier} onChangeText={setFSupplier} placeholder="e.g. Agric-Plus Harare" optional />
        <Input label="Expiry date" value={fExpiry} onChangeText={setFExpiry} placeholder="YYYY-MM-DD" optional error={fErrors.expiry} />
      </Modal>
    </SectionPage>
  );
}

// ---------- Life events ----------
type EventKind = 'Transfer' | 'Death' | 'Herd Change';

const eventIcon: Record<LivestockEvent['type'], IoniconName> = {
  Birth: 'heart-outline',
  Death: 'close-circle-outline',
  Transfer: 'swap-horizontal-outline',
  'Herd Change': 'people-outline',
};

function EventsSection() {
  const { events, animals, recordEvent } = useApp();
  const [show, setShow] = useState(false);
  const [eventType, setEventType] = useState<EventKind>('Transfer');
  const [animalId, setAnimalId] = useState('');
  const [details, setDetails] = useState('Paddock 2 — East Pasture');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!animalId) errs.animal = 'Choose the animal';
    if (!details.trim()) errs.details = 'Describe the event or destination';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    recordEvent({ type: eventType, animalId, details: details.trim() });
    setAnimalId('');
    setShow(false);
  };

  return (
    <SectionPage
      action={
        <Button variant="primary" onPress={() => setShow(true)} style={{ flex: 1 }}>
          Record an event
        </Button>
      }
    >
      <Section title="Recent">
        {events.map((ev, i) => (
          <ListRow
            key={ev.id}
            first={i === 0}
            leftIcon={eventIcon[ev.type]}
            leftIconColor={ev.type === 'Death' ? colors.rust500 : colors.forest700}
            title={`${ev.type} · ${ev.animalName}`}
            subtitle={`${formatShortDate(ev.date)} ${ev.date.slice(0, 4)} · ${ev.details}`}
            numberOfLines={2}
          />
        ))}
      </Section>

      <Modal open={show} onClose={() => setShow(false)} title="Record an event" footer={<ModalFooter onCancel={() => setShow(false)} onSave={handleSave} />}>
        <Select
          label="Event"
          value={eventType}
          onSelect={(v) => {
            setEventType(v as EventKind);
            if (v === 'Transfer') setDetails('Paddock 2 — East Pasture');
            if (v === 'Herd Change') setDetails('Breeding Herd B');
            if (v === 'Death') setDetails('Heartwater infection');
          }}
          options={[
            { value: 'Transfer', label: 'Move to another paddock' },
            { value: 'Herd Change', label: 'Move to another herd' },
            { value: 'Death', label: 'Death' },
          ]}
          required
        />
        <Select
          label="Animal"
          value={animalId}
          onSelect={setAnimalId}
          placeholder="Choose an animal"
          options={animals
            .filter((a) => a.status === 'Active')
            .map((a) => ({ value: a.id, label: `${a.name || a.id} (${a.earTag}) - ${a.herd}` }))}
          required
          error={errors.animal}
        />
        <Input
          label={eventType === 'Death' ? 'Cause' : 'Destination'}
          value={details}
          onChangeText={setDetails}
          required
          error={errors.details}
        />
      </Modal>
    </SectionPage>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.charcoal200,
    padding: spacing.lg,
  },
  summaryLabel: {
    fontSize: font.body,
    color: colors.charcoal500,
  },
  summaryValue: {
    fontSize: font.display,
    fontWeight: weight.bold,
    color: colors.forest700,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.charcoal200,
  },
  summaryMeta: {
    fontSize: font.body,
    color: colors.charcoal500,
  },
  summaryMetaValue: {
    fontWeight: weight.semibold,
    color: colors.charcoal800,
  },
  warning: {
    fontSize: font.caption,
    lineHeight: 17,
    color: colors.amber700,
    backgroundColor: colors.amber50,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: font.caption,
    lineHeight: 17,
    color: colors.charcoal500,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: font.body,
    fontWeight: weight.semibold,
    color: colors.forest700,
  },
  confirmText: {
    fontSize: font.body,
    color: colors.charcoal700,
    textAlign: 'center',
  },
  amount: {
    fontSize: font.body,
    fontWeight: weight.semibold,
  },
  modalGroup: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.charcoal200,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
});
