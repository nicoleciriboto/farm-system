import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AnimalStatus, TaskStatus, SyncState } from '@/types';

// ============= Button =============
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', fullWidth, children, className = '', ...rest }: ButtonProps) {
  const variants = {
    primary: 'bg-forest-700 text-white active:bg-forest-800 hover:bg-forest-800 shadow-sm',
    secondary: 'bg-sage-300 text-charcoal-700 active:bg-sage-400 hover:bg-sage-400',
    outline: 'border-2 border-forest-700 text-forest-700 active:bg-forest-50',
    ghost: 'text-forest-700 active:bg-forest-50',
    danger: 'bg-rust-400 text-white active:bg-rust-500 shadow-sm',
    amber: 'bg-amber-400 text-charcoal-700 active:bg-amber-500 shadow-sm',
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-sm rounded-xl',
    lg: 'px-5 py-3.5 text-base rounded-xl',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors no-tap select-none disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ============= Card =============
interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-charcoal-100 ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ============= Status Badge =============
export function StatusBadge({ status }: { status: AnimalStatus }) {
  const styles: Record<AnimalStatus, string> = {
    Active: 'bg-sage-100 text-sage-700 border-sage-200',
    Sold: 'bg-amber-100 text-amber-700 border-amber-200',
    Deceased: 'bg-charcoal-100 text-charcoal-500 border-charcoal-200',
    Transferred: 'bg-forest-50 text-forest-600 border-forest-100',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {status}
    </span>
  );
}

// ============= Task Status Badge =============
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    Upcoming: 'bg-forest-50 text-forest-700 border-forest-100',
    'Due Today': 'bg-amber-100 text-amber-700 border-amber-200',
    Overdue: 'bg-rust-50 text-rust-400 border-rust-100',
    Completed: 'bg-charcoal-50 text-charcoal-400 border-charcoal-100',
  };
  const dotColor: Record<TaskStatus, string> = {
    Upcoming: 'bg-forest-500',
    'Due Today': 'bg-amber-400',
    Overdue: 'bg-rust-400',
    Completed: 'bg-charcoal-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor[status]}`} />
      {status}
    </span>
  );
}

// ============= Sync Indicator =============
export function SyncIndicator({ state, compact }: { state: SyncState; compact?: boolean }) {
  const config: Record<SyncState, { color: string; bg: string; label: string; icon: 'dot' | 'pulse' | 'offline' | 'sync' | 'error' }> = {
    Synced: { color: 'text-forest-700', bg: 'bg-forest-50 border-forest-100', label: 'Synced', icon: 'dot' },
    Offline: { color: 'text-charcoal-500', bg: 'bg-charcoal-50 border-charcoal-100', label: 'Offline', icon: 'offline' },
    Pending: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', label: 'Changes pending', icon: 'pulse' },
    Syncing: { color: 'text-forest-600', bg: 'bg-forest-50 border-forest-100', label: 'Syncing...', icon: 'sync' },
    Failed: { color: 'text-rust-400', bg: 'bg-rust-50 border-rust-100', label: 'Sync failed', icon: 'error' },
  };
  const c = config[state];
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.color}`}>
        {c.icon === 'dot' && <span className="w-1.5 h-1.5 rounded-full bg-forest-500" />}
        {c.icon === 'pulse' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
        {c.icon === 'sync' && <span className="w-3 h-3 rounded-full border-2 border-forest-600 border-t-transparent animate-spin" />}
        {c.icon === 'offline' && <span className="w-1.5 h-1.5 rounded-full bg-charcoal-300" />}
        {c.icon === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-rust-400" />}
        {c.label}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${c.bg} ${c.color}`}>
      {c.icon === 'dot' && <span className="w-2 h-2 rounded-full bg-forest-500" />}
      {c.icon === 'pulse' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
      {c.icon === 'sync' && <span className="w-4 h-4 rounded-full border-2 border-forest-600 border-t-transparent animate-spin" />}
      {c.icon === 'offline' && <span className="w-2 h-2 rounded-full bg-charcoal-300" />}
      {c.icon === 'error' && <span className="w-2 h-2 rounded-full bg-rust-400" />}
      {c.label}
    </span>
  );
}

// ============= Input Field =============
interface InputProps {
  label?: string;
  value: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'date' | 'textarea';
  required?: boolean;
  optional?: boolean;
  icon?: ReactNode;
  className?: string;
  readOnly?: boolean;
}

export function Input({ label, value, onChange, placeholder, type = 'text', required, optional, icon, className = '', readOnly }: InputProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-charcoal-600 mb-1.5">
          {label}
          {required && <span className="text-rust-400 ml-0.5">*</span>}
          {optional && <span className="text-charcoal-300 font-normal ml-1">(optional)</span>}
        </label>
      )}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-300">{icon}</div>}
        {type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            rows={3}
            className={`w-full px-3.5 py-3 text-sm bg-white border border-charcoal-200 rounded-xl focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 transition-all ${icon ? 'pl-10' : ''} ${readOnly ? 'bg-cream-100' : ''}`}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`w-full px-3.5 py-3 text-sm bg-white border border-charcoal-200 rounded-xl focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 transition-all ${icon ? 'pl-10' : ''} ${readOnly ? 'bg-cream-100 text-charcoal-500' : ''}`}
          />
        )}
      </div>
    </div>
  );
}

// ============= Select =============
interface SelectProps {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}

export function Select({ label, value, onChange, options, required, placeholder }: SelectProps) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-charcoal-600 mb-1.5">
          {label}
          {required && <span className="text-rust-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3.5 py-3 text-sm bg-white border border-charcoal-200 rounded-xl focus:outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-100 transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23252B27%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center] pr-10"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ============= Modal =============
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center" style={{ maxHeight: '100%' }}>
      <div className="absolute inset-0 bg-charcoal-900/50 animate-fade-in" onClick={onClose} />
      <div className="relative w-full bg-cream-100 rounded-t-3xl max-h-[90%] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-charcoal-100">
          <h3 className="text-lg font-bold text-charcoal-700">{title}</h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full active:bg-charcoal-100 no-tap">
            <X className="w-5 h-5 text-charcoal-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
          {children}
        </div>
        {footer && <div className="px-5 py-4 border-t border-charcoal-100 bg-white rounded-b-3xl">{footer}</div>}
      </div>
    </div>
  );
}

// ============= Confirm Dialog =============
interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm' }: ConfirmProps) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-charcoal-900/50 animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in">
        <h3 className="text-lg font-bold text-charcoal-700 mb-2">{title}</h3>
        <p className="text-sm text-charcoal-400 mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="primary" fullWidth onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

// ============= Empty State =============
export function EmptyState({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-cream-200 flex items-center justify-center text-charcoal-300 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-charcoal-600 mb-1">{title}</h3>
      <p className="text-sm text-charcoal-400 max-w-xs mb-4">{message}</p>
      {action}
    </div>
  );
}

// ============= Section Header =============
export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-charcoal-700">{title}</h2>
      {action}
    </div>
  );
}

// ============= Progress Bar =============
export function ProgressBar({ value, max, label, color = 'forest' }: { value: number; max: number; label?: string; color?: 'forest' | 'amber' | 'rust' }) {
  const pct = Math.min(100, (value / max) * 100);
  const colors = { forest: 'bg-forest-600', amber: 'bg-amber-400', rust: 'bg-rust-400' };
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-charcoal-400 mb-1"><span>{label}</span><span>{value}/{max}</span></div>}
      <div className="h-2 rounded-full bg-charcoal-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colors[color]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ============= Toast =============
export function Toast({ message, type }: { message: string; type: 'success' | 'error' | 'info' }) {
  const styles = {
    success: 'bg-forest-700 text-white',
    error: 'bg-rust-400 text-white',
    info: 'bg-charcoal-700 text-white',
  };
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className={`px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${styles[type]} max-w-[90%] text-center`}>
        {message}
      </div>
    </div>
  );
}
