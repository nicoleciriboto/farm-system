export type AnimalStatus = 'Active' | 'Sold' | 'Deceased' | 'Transferred';
export type Species = 'Cattle' | 'Goats' | 'Sheep';
export type Sex = 'Male' | 'Female';
export type TaskStatus = 'Upcoming' | 'Due Today' | 'Overdue' | 'Completed';
export type SyncState = 'Synced' | 'Offline' | 'Pending' | 'Syncing' | 'Failed';
export type UserRole = 'Farm Owner' | 'Farm Manager' | 'Farm Worker';

export interface WeightRecord {
  date: string;
  weightKg: number;
}

export interface HealthRecord {
  id: string;
  type: 'Dipping' | 'Vaccination' | 'Vet Visit' | 'Treatment';
  name: string;
  date: string;
  product?: string;
  dosage?: string;
  administeredBy: string;
  outcome: string;
  nextDue?: string;
}

export interface BreedingRecord {
  sireId?: string;
  sireName?: string;
  damId?: string;
  damName?: string;
  matingDate?: string;
  pregnancyStatus?: 'Confirmed' | 'Suspected' | 'Open' | 'Not Applicable';
  expectedCalving?: string;
  offspring: { id: string; name: string; date: string; status: AnimalStatus }[];
}

export interface ActivityEntry {
  id: string;
  type: 'Birth' | 'Vaccination' | 'Weight' | 'Sale' | 'Treatment' | 'Transfer' | 'Death' | 'Purchase';
  description: string;
  date: string;
  icon: string;
}

export interface Animal {
  id: string;
  earTag: string;
  name?: string;
  species: Species;
  breed: string;
  sex: Sex;
  dateOfBirth: string;
  colorMarks: string;
  acquisitionSource: 'Born on Farm' | 'Purchased';
  acquisitionDate: string;
  purchasePrice?: number;
  herd: string;
  location: string;
  parentSire?: string;
  parentDam?: string;
  currentWeight: number;
  photo: string;
  status: AnimalStatus;
  notes?: string;
  weightHistory: WeightRecord[];
  healthRecords: HealthRecord[];
  breeding: BreedingRecord;
  activities: ActivityEntry[];
  pendingSync?: boolean;
}

export interface HealthTask {
  id: string;
  name: string;
  type: 'Dipping' | 'Vaccination' | 'Vet Visit' | 'Treatment';
  scheduledDate: string;
  status: TaskStatus;
  assignedTo: string;
  herdOrAnimals: string;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  recurring?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Veterinary Medicine' | 'Feed' | 'Equipment' | 'Other';
  quantity: number;
  unit: string;
  reorderThreshold: number;
  supplier: string;
  expiryDate?: string;
  stockHistory: { date: string; type: 'Stock In' | 'Stock Out'; quantity: number; note: string }[];
}

export interface FinancialRecord {
  id: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  date: string;
  paymentMethod: string;
  notes: string;
  /** Set on ledger rows generated from a salary payment (not stored separately). */
  salaryPaymentId?: string;
}

export type SalaryPaymentMethod = 'Cash' | 'Mobile Money' | 'Bank Transfer';

export interface SalaryPayment {
  id: string;
  /** Team member id, or undefined for a casual worker who isn't on the team list. */
  workerId?: string;
  workerName: string;
  workerRole: string;
  amount: number;
  /** Date the money was paid (YYYY-MM-DD). */
  date: string;
  /** Month the payment covers (YYYY-MM). */
  period: string;
  method: SalaryPaymentMethod;
  notes?: string;
  recordedBy: string;
}

export interface LivestockTransaction {
  id: string;
  type: 'Purchase' | 'Sale';
  animalIds: string[];
  quantity: number;
  unitPrice: number;
  totalValue: number;
  counterparty: string;
  date: string;
  notes?: string;
}

export interface LivestockEvent {
  id: string;
  type: 'Birth' | 'Death' | 'Transfer' | 'Herd Change';
  animalId: string;
  animalName: string;
  date: string;
  details: string;
  notes?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  permissions: string[];
  /** Usual monthly pay in USD — pre-fills the salary form. */
  monthlySalary?: number;
}
