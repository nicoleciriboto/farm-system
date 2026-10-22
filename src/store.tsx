import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Animal,
  FinancialRecord,
  HealthRecord,
  HealthTask,
  InventoryItem,
  LivestockEvent,
  LivestockTransaction,
  SalaryPayment,
  SyncState,
  TeamMember,
} from '@/types';
import {
  animals as initialAnimals,
  healthTasks as initialTasks,
  inventoryItems as initialInventory,
  financialRecords as initialFinancial,
  livestockTransactions as initialTransactions,
  livestockEvents as initialEvents,
  salaryPayments as initialSalaries,
  teamMembers as initialTeam,
  farmInfo,
  today,
} from '@/data';
import { monthLabel } from '@/utils';

export type ScreenName =
  | 'home'
  | 'livestock'
  | 'addAnimal'
  | 'animalProfile'
  | 'health'
  | 'healthTaskDetail'
  | 'operations'
  | 'operationsSection'
  | 'reports'
  | 'settings';

export const TAB_SCREENS: ScreenName[] = ['home', 'livestock', 'health', 'operations'];

interface NavEntry {
  screen: ScreenName;
  animalId: string | null;
  taskId: string | null;
  operationsTab: string;
}

type NavOpts = { animalId?: string; taskId?: string; operationsTab?: string; /** Swap out the current screen instead of pushing */ replace?: boolean };
type LifeEventType = 'Birth' | 'Death' | 'Transfer' | 'Herd Change';

interface AppContextValue {
  // Navigation
  screen: ScreenName;
  selectedAnimalId: string | null;
  selectedTaskId: string | null;
  operationsTab: string;
  navigate: (screen: ScreenName, opts?: NavOpts) => void;
  /** Pops the back stack. Returns false when already at the root (so Android can exit). */
  goBack: () => boolean;
  canGoBack: boolean;

  // Data
  hydrated: boolean;
  animals: Animal[];
  healthTasks: HealthTask[];
  inventory: InventoryItem[];
  financialRecords: FinancialRecord[];
  /** Ledger shown to the user: manual finance entries + salary payments as expenses, newest first. */
  ledger: FinancialRecord[];
  salaryPayments: SalaryPayment[];
  team: TeamMember[];
  transactions: LivestockTransaction[];
  events: LivestockEvent[];

  // Actions
  addAnimal: (animal: Animal) => void;
  updateAnimal: (animalId: string, updates: Partial<Animal>) => void;
  recordWeight: (animalId: string, weightKg: number) => void;
  recordTreatment: (animalId: string, treatment: Omit<HealthRecord, 'id'>) => void;
  completeHealthTask: (taskId: string, completionData: { date: string; product: string; dosage: string; notes: string; animalIds: string[] }) => void;
  recordStockUsage: (itemId: string, quantity: number, note: string) => void;
  restockInventory: (itemId: string, quantity: number, supplier?: string) => void;
  recordSale: (animalId: string, buyer: string, price: number) => void;
  recordBirth: (animal: Animal) => void;
  recordEvent: (event: { type: LifeEventType; animalId: string; details: string; notes?: string }) => void;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => void;
  addSalaryPayment: (payment: Omit<SalaryPayment, 'id' | 'recordedBy'>) => void;
  deleteSalaryPayment: (paymentId: string) => void;
  saveTeamMember: (member: Omit<TeamMember, 'id' | 'permissions'> & { id?: string }) => void;
  removeTeamMember: (memberId: string) => void;
  saveInventoryItem: (item: Omit<InventoryItem, 'id' | 'stockHistory'> & { id?: string }) => void;
  deleteInventoryItem: (itemId: string) => void;
  addHealthTask: (task: Omit<HealthTask, 'id' | 'status'>) => void;
  deleteHealthTask: (taskId: string) => void;
  resetData: () => void;

  // Sync
  syncState: SyncState;
  setSyncState: (state: SyncState) => void;
  triggerSync: () => void;
  pendingChanges: number;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // UI state
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'ngombe:farm-data:v1';

interface PersistedData {
  animals: Animal[];
  healthTasks: HealthTask[];
  inventory: InventoryItem[];
  financialRecords: FinancialRecord[];
  salaryPayments: SalaryPayment[];
  team: TeamMember[];
  transactions: LivestockTransaction[];
  events: LivestockEvent[];
  pendingChanges: number;
}

const DEFAULT_PERMISSIONS: Record<TeamMember['role'], string[]> = {
  'Farm Owner': ['Full Access'],
  'Farm Manager': ['Livestock', 'Health', 'Inventory', 'Reports'],
  'Farm Worker': ['View Tasks', 'Record Treatments', 'Record Weights', 'Report Events'],
};

/** Salary payments appear in the finance ledger as Labour expenses (derived, never stored twice). */
function salaryToLedger(p: SalaryPayment): FinancialRecord {
  return {
    id: `L-${p.id}`,
    type: 'Expense',
    category: `Salary · ${p.workerName}`,
    amount: p.amount,
    date: p.date,
    paymentMethod: p.method,
    notes: `Wages for ${monthLabel(p.period)}`,
    salaryPaymentId: p.id,
  };
}

const AppContext = createContext<AppContextValue | null>(null);

/** Open tasks get their status from the date so it can never disagree with the calendar. */
function withDerivedStatus(task: HealthTask): HealthTask {
  if (task.status === 'Completed') return task;
  const status = task.scheduledDate < today ? 'Overdue' : task.scheduledDate === today ? 'Due Today' : 'Upcoming';
  return status === task.status ? task : { ...task, status };
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<NavEntry[]>([
    { screen: 'home', animalId: initialAnimals[0]?.id || null, taskId: initialTasks[0]?.id || null, operationsTab: 'overview' },
  ]);
  const current = history[history.length - 1];

  const [hydrated, setHydrated] = useState(false);
  const [animals, setAnimals] = useState<Animal[]>(initialAnimals);
  const [healthTasks, setHealthTasks] = useState<HealthTask[]>(initialTasks);
  const visibleTasks = useMemo(() => healthTasks.map(withDerivedStatus), [healthTasks]);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(initialFinancial);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>(initialSalaries);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const ledger = useMemo(
    () => [...financialRecords, ...salaryPayments.map(salaryToLedger)].sort((a, b) => b.date.localeCompare(a.date)),
    [financialRecords, salaryPayments],
  );
  const [transactions, setTransactions] = useState<LivestockTransaction[]>(initialTransactions);
  const [events, setEvents] = useState<LivestockEvent[]>(initialEvents);

  const [syncState, setSyncState] = useState<SyncState>('Synced');
  const [pendingChanges, setPendingChanges] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // ---------- Persistence (device-local, survives app restarts) ----------
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved: Partial<PersistedData> = JSON.parse(raw);
        if (saved.animals) setAnimals(saved.animals);
        if (saved.healthTasks) setHealthTasks(saved.healthTasks);
        if (saved.inventory) setInventory(saved.inventory);
        if (saved.financialRecords) {
          // Data saved before payroll existed has October's wages as one lump-sum line ('F004');
          // the salary records now cover it, so drop it to avoid counting the wages twice.
          setFinancialRecords(saved.salaryPayments ? saved.financialRecords : saved.financialRecords.filter((r) => r.id !== 'F004'));
        }
        if (saved.salaryPayments) setSalaryPayments(saved.salaryPayments);
        if (saved.team) setTeam(saved.team);
        if (saved.transactions) setTransactions(saved.transactions);
        if (saved.events) setEvents(saved.events);
        if (saved.pendingChanges) {
          setPendingChanges(saved.pendingChanges);
          setSyncState('Pending');
        }
      })
      .catch(() => {
        // Corrupt or unreadable storage — fall back to sample data
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const data: PersistedData = { animals, healthTasks, inventory, financialRecords, salaryPayments, team, transactions, events, pendingChanges };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
  }, [hydrated, animals, healthTasks, inventory, financialRecords, salaryPayments, team, transactions, events, pendingChanges]);

  // ---------- Navigation (simple stack so Android back works) ----------
  const navigate = useCallback((dest: ScreenName, opts?: NavOpts) => {
    setHistory((prev) => {
      const top = prev[prev.length - 1];
      const entry: NavEntry = {
        screen: dest,
        animalId: opts?.animalId ?? top.animalId,
        taskId: opts?.taskId ?? top.taskId,
        operationsTab: opts?.operationsTab ?? 'overview',
      };
      // Tab switches reset the stack to Home → tab, like a native tab bar
      if (TAB_SCREENS.includes(dest)) {
        const home = { ...prev[0], screen: 'home' as const };
        return dest === 'home' ? [{ ...entry }] : [home, entry];
      }
      return opts?.replace ? [...prev.slice(0, -1), entry] : [...prev, entry];
    });
  }, []);

  const historyRef = useRef(history);
  historyRef.current = history;

  const goBack = useCallback(() => {
    if (historyRef.current.length <= 1) return false;
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    return true;
  }, []);

  // ---------- Feedback ----------
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const markPending = useCallback(() => {
    setSyncState('Pending');
    setPendingChanges((c) => c + 1);
  }, []);

  const triggerSync = useCallback(() => {
    setSyncState('Syncing');
    showToast('Syncing changes with cloud server...', 'info');
    setTimeout(() => {
      setSyncState('Synced');
      setPendingChanges(0);
      showToast('All farm records successfully synced!', 'success');
    }, 1500);
  }, [showToast]);

  // ---------- Livestock ----------
  const addAnimal = useCallback((animal: Animal) => {
    setAnimals((prev) => [animal, ...prev]);
    markPending();
    showToast(`${animal.name || animal.id} registered successfully`);
  }, [markPending, showToast]);

  const updateAnimal = useCallback((animalId: string, updates: Partial<Animal>) => {
    setAnimals((prev) => prev.map((a) => (a.id === animalId ? { ...a, ...updates } : a)));
    markPending();
    showToast(`Animal ${animalId} updated successfully`);
  }, [markPending, showToast]);

  const recordWeight = useCallback((animalId: string, weightKg: number) => {
    setAnimals((prev) => prev.map((a) => {
      if (a.id !== animalId) return a;
      const delta = weightKg - a.currentWeight;
      return {
        ...a,
        currentWeight: weightKg,
        weightHistory: [...a.weightHistory, { date: today, weightKg }],
        activities: [
          {
            id: `AC${Date.now()}`,
            type: 'Weight' as const,
            description: `Weight measured: ${weightKg} kg (${delta > 0 ? '+' : ''}${delta} kg)`,
            date: today,
            icon: 'scale',
          },
          ...a.activities,
        ],
      };
    }));
    markPending();
    showToast(`Weight recorded: ${weightKg} kg`);
  }, [markPending, showToast]);

  const recordTreatment = useCallback((animalId: string, treatment: Omit<HealthRecord, 'id'>) => {
    const newRecord: HealthRecord = { ...treatment, id: `H${Date.now()}` };
    setAnimals((prev) => prev.map((a) => {
      if (a.id !== animalId) return a;
      return {
        ...a,
        healthRecords: [newRecord, ...a.healthRecords],
        activities: [
          {
            id: `AC${Date.now()}`,
            type: 'Treatment' as const,
            description: `${treatment.type}: ${treatment.name}${treatment.product ? ` (${treatment.product})` : ''} administered`,
            date: treatment.date || today,
            icon: 'syringe',
          },
          ...a.activities,
        ],
      };
    }));
    markPending();
    showToast(`Treatment recorded for animal ${animalId}`);
  }, [markPending, showToast]);

  const completeHealthTask = useCallback((taskId: string, completionData: { date: string; product: string; dosage: string; notes: string; animalIds: string[] }) => {
    const task = healthTasks.find((t) => t.id === taskId);
    setHealthTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'Completed' as const } : t)));

    // Propagate record to selected affected animals
    if (completionData.animalIds.length > 0 && task) {
      setAnimals((prev) => prev.map((animal) => {
        if (!completionData.animalIds.includes(animal.id)) return animal;
        const newRecord: HealthRecord = {
          id: `H${Date.now()}_${animal.id}`,
          type: task.type,
          name: task.name,
          date: completionData.date || today,
          product: completionData.product,
          dosage: completionData.dosage,
          administeredBy: task.assignedTo || 'Farm Staff',
          outcome: completionData.notes || 'Completed as scheduled',
        };
        const newActivity = {
          id: `AC${Date.now()}_${animal.id}`,
          type: 'Treatment' as const,
          description: `${task.name} completed by ${task.assignedTo}`,
          date: completionData.date || today,
          icon: 'syringe',
        };
        return {
          ...animal,
          healthRecords: [newRecord, ...animal.healthRecords],
          activities: [newActivity, ...animal.activities],
        };
      }));
    }

    markPending();
    showToast(`Task completed! Saved to ${completionData.animalIds.length} animal records.`);
  }, [healthTasks, markPending, showToast]);

  // ---------- Inventory ----------
  const recordStockUsage = useCallback((itemId: string, quantity: number, note: string) => {
    setInventory((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        quantity: Math.max(0, item.quantity - quantity),
        stockHistory: [{ date: today, type: 'Stock Out' as const, quantity, note }, ...item.stockHistory],
      };
    }));
    markPending();
    showToast(`Stock usage recorded: ${quantity} units`);
  }, [markPending, showToast]);

  const restockInventory = useCallback((itemId: string, quantity: number, supplier?: string) => {
    setInventory((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        quantity: item.quantity + quantity,
        supplier: supplier || item.supplier,
        stockHistory: [
          { date: today, type: 'Stock In' as const, quantity, note: `Restocked +${quantity} units` },
          ...item.stockHistory,
        ],
      };
    }));
    markPending();
    showToast(`Restocked ${quantity} units`);
  }, [markPending, showToast]);

  // ---------- Trading, finance & life events ----------
  const addFinancialRecord = useCallback((record: Omit<FinancialRecord, 'id'>) => {
    setFinancialRecords((prev) => [{ ...record, id: `F${Date.now()}` }, ...prev]);
    markPending();
    showToast(`${record.type} of $${record.amount.toLocaleString()} recorded`);
  }, [markPending, showToast]);

  const addSalaryPayment = useCallback((payment: Omit<SalaryPayment, 'id' | 'recordedBy'>) => {
    setSalaryPayments((prev) => [{ ...payment, id: `SP${Date.now()}`, recordedBy: farmInfo.owner }, ...prev]);
    markPending();
    showToast(`Paid ${payment.workerName} $${payment.amount.toLocaleString()}`);
  }, [markPending, showToast]);

  const deleteSalaryPayment = useCallback((paymentId: string) => {
    setSalaryPayments((prev) => prev.filter((p) => p.id !== paymentId));
    markPending();
    showToast('Salary payment deleted', 'info');
  }, [markPending, showToast]);

  // ---------- Team, stock items & health tasks ----------
  const saveTeamMember = useCallback((member: Omit<TeamMember, 'id' | 'permissions'> & { id?: string }) => {
    if (member.id) {
      setTeam((prev) => prev.map((m) => (m.id === member.id ? { ...m, ...member, id: m.id, permissions: DEFAULT_PERMISSIONS[member.role] } : m)));
      showToast(`${member.name} updated`);
    } else {
      setTeam((prev) => [...prev, { ...member, id: `TM${Date.now()}`, permissions: DEFAULT_PERMISSIONS[member.role] }]);
      showToast(`${member.name} added to the team`);
    }
    markPending();
  }, [markPending, showToast]);

  const removeTeamMember = useCallback((memberId: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== memberId || m.role === 'Farm Owner'));
    markPending();
    showToast('Removed from the team', 'info');
  }, [markPending, showToast]);

  const saveInventoryItem = useCallback((item: Omit<InventoryItem, 'id' | 'stockHistory'> & { id?: string }) => {
    if (item.id) {
      setInventory((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...item, id: i.id } : i)));
      showToast(`${item.name} updated`);
    } else {
      setInventory((prev) => [
        ...prev,
        {
          ...item,
          id: `INV${Date.now()}`,
          stockHistory: item.quantity > 0 ? [{ date: today, type: 'Stock In' as const, quantity: item.quantity, note: 'Opening stock' }] : [],
        },
      ]);
      showToast(`${item.name} added to inventory`);
    }
    markPending();
  }, [markPending, showToast]);

  const deleteInventoryItem = useCallback((itemId: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== itemId));
    markPending();
    showToast('Item removed from inventory', 'info');
  }, [markPending, showToast]);

  const addHealthTask = useCallback((task: Omit<HealthTask, 'id' | 'status'>) => {
    // Status is worked out from the date when tasks are read (see withDerivedStatus)
    setHealthTasks((prev) => [...prev, { ...task, id: `T${Date.now()}`, status: 'Upcoming' }]);
    markPending();
    showToast(`Task scheduled for ${task.scheduledDate}`);
  }, [markPending, showToast]);

  const deleteHealthTask = useCallback((taskId: string) => {
    setHealthTasks((prev) => prev.filter((t) => t.id !== taskId));
    markPending();
    showToast('Task deleted', 'info');
  }, [markPending, showToast]);

  const recordSale = useCallback((animalId: string, buyer: string, price: number) => {
    setAnimals((prev) => prev.map((a) => {
      if (a.id !== animalId) return a;
      return {
        ...a,
        status: 'Sold' as const,
        activities: [
          {
            id: `AC${Date.now()}`,
            type: 'Sale' as const,
            description: `Sold to ${buyer} for $${price}`,
            date: today,
            icon: 'tag',
          },
          ...a.activities,
        ],
      };
    }));
    setTransactions((prev) => [
      {
        id: `TX${Date.now()}`,
        type: 'Sale',
        animalIds: [animalId],
        quantity: 1,
        unitPrice: price,
        totalValue: price,
        counterparty: buyer,
        date: today,
      },
      ...prev,
    ]);
    setFinancialRecords((prev) => [
      {
        id: `F${Date.now()}`,
        type: 'Income',
        category: 'Livestock Sales',
        amount: price,
        date: today,
        paymentMethod: 'Cash',
        notes: `Sold ${animalId} to ${buyer}`,
      },
      ...prev,
    ]);
    markPending();
    showToast(`Sale recorded: ${animalId} sold to ${buyer}`);
  }, [markPending, showToast]);

  const recordBirth = useCallback((animal: Animal) => {
    setAnimals((prev) => {
      const withCalf = [animal, ...prev];
      if (!animal.parentDam) return withCalf;
      // Register the newborn on the dam's offspring list
      return withCalf.map((a) =>
        a.id === animal.parentDam
          ? {
              ...a,
              breeding: {
                ...a.breeding,
                offspring: [
                  ...a.breeding.offspring,
                  { id: animal.id, name: animal.name || animal.id, date: animal.dateOfBirth, status: animal.status },
                ],
              },
            }
          : a,
      );
    });
    setEvents((prev) => [
      {
        id: `EV${Date.now()}`,
        type: 'Birth',
        animalId: animal.id,
        animalName: animal.name || animal.id,
        date: animal.dateOfBirth,
        details: animal.parentDam ? `Born on farm to ${animal.parentDam}` : 'Born on farm',
      },
      ...prev,
    ]);
    markPending();
    showToast(`Birth recorded: ${animal.name || animal.id}`);
  }, [markPending, showToast]);

  const recordEvent = useCallback((event: { type: LifeEventType; animalId: string; details: string; notes?: string }) => {
    const found = animals.find((a) => a.id === event.animalId);
    setAnimals((prev) => prev.map((a) => {
      if (a.id !== event.animalId) return a;
      return {
        ...a,
        status: event.type === 'Death' ? 'Deceased' : a.status,
        location: event.type === 'Transfer' ? event.details : a.location,
        herd: event.type === 'Herd Change' ? event.details : a.herd,
        activities: [
          {
            id: `AC${Date.now()}`,
            type: event.type === 'Death' ? 'Death' : event.type === 'Birth' ? 'Birth' : 'Transfer',
            description: `${event.type}: ${event.details}`,
            date: today,
            icon: event.type === 'Death' ? 'alert' : event.type === 'Birth' ? 'baby' : 'tag',
          },
          ...a.activities,
        ],
      };
    }));
    setEvents((prev) => [
      {
        id: `EV${Date.now()}`,
        type: event.type,
        animalId: event.animalId,
        animalName: found?.name || event.animalId,
        date: today,
        details: event.details,
        notes: event.notes,
      },
      ...prev,
    ]);
    markPending();
    showToast(`Event recorded: ${event.type} for ${event.animalId}`);
  }, [animals, markPending, showToast]);

  const resetData = useCallback(() => {
    setAnimals(initialAnimals);
    setHealthTasks(initialTasks);
    setInventory(initialInventory);
    setFinancialRecords(initialFinancial);
    setSalaryPayments(initialSalaries);
    setTeam(initialTeam);
    setTransactions(initialTransactions);
    setEvents(initialEvents);
    setSyncState('Synced');
    setPendingChanges(0);
    setHistory([{ screen: 'home', animalId: initialAnimals[0]?.id || null, taskId: initialTasks[0]?.id || null, operationsTab: 'overview' }]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    showToast('Farm data reset to original sample data');
  }, [showToast]);

  return (
    <AppContext.Provider
      value={{
        screen: current.screen,
        selectedAnimalId: current.animalId,
        selectedTaskId: current.taskId,
        operationsTab: current.operationsTab,
        navigate,
        goBack,
        canGoBack: history.length > 1,
        hydrated,
        animals,
        healthTasks: visibleTasks,
        inventory,
        financialRecords,
        ledger,
        salaryPayments,
        team,
        transactions,
        events,
        addAnimal,
        updateAnimal,
        recordWeight,
        recordTreatment,
        completeHealthTask,
        recordStockUsage,
        restockInventory,
        recordSale,
        recordBirth,
        recordEvent,
        addFinancialRecord,
        addSalaryPayment,
        deleteSalaryPayment,
        saveTeamMember,
        removeTeamMember,
        saveInventoryItem,
        deleteInventoryItem,
        addHealthTask,
        deleteHealthTask,
        resetData,
        syncState,
        setSyncState,
        triggerSync,
        pendingChanges,
        toast,
        showToast,
        isNotificationsOpen,
        setIsNotificationsOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
