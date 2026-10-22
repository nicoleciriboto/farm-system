import { useState } from 'react';
import { X, AlertTriangle, Syringe, Package, Baby, Droplets, CheckCheck, Clock, ChevronRight } from 'lucide-react';
import { useApp } from '@/store';
import { Button } from '@/components/UI';

interface FarmAlert {
  id: string;
  type: 'urgent' | 'health' | 'inventory' | 'breeding';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionLabel?: string;
  actionDestination?: { screen: any; animalId?: string; taskId?: string; operationsTab?: string };
}

export function NotificationCenter() {
  const { isNotificationsOpen, setIsNotificationsOpen, navigate } = useApp();
  const [filter, setFilter] = useState<'all' | 'urgent' | 'health' | 'inventory'>('all');
  const [alerts, setAlerts] = useState<FarmAlert[]>([
    {
      id: 'ALT001',
      type: 'urgent',
      title: 'Dipping Overdue: Breeding Herd A',
      message: 'Weekly plunge dip (Triatix) is 1 day overdue for 12 cattle. Critical for tick fever prevention.',
      timestamp: '1h ago',
      read: false,
      actionLabel: 'View Task',
      actionDestination: { screen: 'health' },
    },
    {
      id: 'ALT002',
      type: 'inventory',
      title: 'Low Stock: Tick Grease Concentrate',
      message: 'Only 3.5L left in store. Reorder threshold is 5.0L. Dip tank needs refilling on Friday.',
      timestamp: '3h ago',
      read: false,
      actionLabel: 'Restock Item',
      actionDestination: { screen: 'operations', operationsTab: 'inventory' },
    },
    {
      id: 'ALT003',
      type: 'breeding',
      title: 'Calving Due Soon: Cow Mhondoro (CF-001)',
      message: 'Expected calving date is 28 Oct (16 days away). Sire: Shumba. Move to nursery paddock soon.',
      timestamp: '5h ago',
      read: false,
      actionLabel: 'View Cow Profile',
      actionDestination: { screen: 'animalProfile', animalId: 'A001' },
    },
    {
      id: 'ALT004',
      type: 'health',
      title: 'Vaccination Due: Anthrax Booster',
      message: 'Annual Anthrax booster scheduled for today. 14 head of cattle in Breeding Herd A.',
      timestamp: '8h ago',
      read: false,
      actionLabel: 'Record Treatment',
      actionDestination: { screen: 'health' },
    },
    {
      id: 'ALT005',
      type: 'inventory',
      title: 'Low Stock: Oxytetracycline 20% LA',
      message: 'Only 2 bottles remaining (100ml each). Used frequently for tick-borne infection therapy.',
      timestamp: '1d ago',
      read: true,
      actionLabel: 'View Inventory',
      actionDestination: { screen: 'operations', operationsTab: 'inventory' },
    },
    {
      id: 'ALT006',
      type: 'urgent',
      title: 'Withdrawal Alert: Penicillin Treatment',
      message: 'Cow CF-005 milk & meat withdrawal active until 18 Oct. Do not mix milk into bulk tank.',
      timestamp: '1d ago',
      read: true,
      actionLabel: 'View Animal',
      actionDestination: { screen: 'animalProfile', animalId: 'A005' },
    },
  ]);

  if (!isNotificationsOpen) return null;

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'urgent') return a.type === 'urgent';
    if (filter === 'health') return a.type === 'health' || a.type === 'breeding';
    if (filter === 'inventory') return a.type === 'inventory';
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-charcoal-900/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-[420px] bg-cream-50 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-charcoal-200 overflow-hidden flex flex-col max-h-[85vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-charcoal-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-forest-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-forest-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-700">Farm Alerts & Notices</h2>
              <p className="text-xs text-charcoal-400">
                {unreadCount > 0 ? `${unreadCount} unread warnings requiring attention` : 'All alerts up to date'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-charcoal-400 active:bg-cream-200 no-tap"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills & Actions */}
        <div className="px-4 py-2.5 bg-white border-b border-charcoal-100 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 shrink-0">
            {(['all', 'urgent', 'health', 'inventory'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-colors no-tap ${
                  filter === tab
                    ? 'bg-forest-700 text-white shadow-xs'
                    : 'bg-cream-200 text-charcoal-500 hover:bg-cream-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-forest-700 flex items-center gap-1 shrink-0 no-tap"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Read all
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-charcoal-400">
              <CheckCheck className="w-8 h-8 mx-auto text-forest-600 mb-2" />
              <p className="text-sm font-semibold">No alerts in this category</p>
              <p className="text-xs text-charcoal-400 mt-0.5">Everything is running smoothly on the farm</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const iconMap = {
                urgent: <AlertTriangle className="w-4 h-4 text-rust-500" />,
                health: <Syringe className="w-4 h-4 text-forest-600" />,
                inventory: <Package className="w-4 h-4 text-amber-600" />,
                breeding: <Baby className="w-4 h-4 text-sage-600" />,
              };
              const bgMap = {
                urgent: 'bg-rust-50 border-rust-200/80',
                health: 'bg-forest-50/60 border-forest-100',
                inventory: 'bg-amber-50/60 border-amber-200/70',
                breeding: 'bg-sage-50 border-sage-200/80',
              };

              return (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-2xl border transition-all ${bgMap[alert.type]} ${
                    !alert.read ? 'shadow-xs ring-1 ring-forest-500/10' : 'opacity-85'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/80 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                      {iconMap[alert.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs font-bold text-charcoal-800 truncate">{alert.title}</h3>
                        <span className="text-[10px] text-charcoal-400 font-medium shrink-0 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {alert.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-600 mt-1 leading-relaxed">{alert.message}</p>

                      {alert.actionLabel && alert.actionDestination && (
                        <div className="mt-2.5 pt-2 border-t border-charcoal-100/60 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              navigate(alert.actionDestination!.screen, alert.actionDestination);
                            }}
                            className="text-xs font-bold text-forest-700 hover:text-forest-800 flex items-center gap-1 no-tap"
                          >
                            {alert.actionLabel}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          {!alert.read && (
                            <span className="w-2 h-2 rounded-full bg-forest-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-charcoal-100">
          <Button variant="outline" size="sm" fullWidth onClick={() => setIsNotificationsOpen(false)}>
            Close Notifications
          </Button>
        </div>
      </div>
    </div>
  );
}
