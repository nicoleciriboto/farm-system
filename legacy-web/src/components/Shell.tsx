import { useState, type ReactNode } from 'react';
import {
  Home,
  Beef,
  HeartPulse,
  Briefcase,
  BarChart3,
  Settings,
  ArrowLeft,
  Bell,
  Smartphone,
  RotateCcw,
  Cloud,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { useApp, type ScreenName, type DeviceFrameType } from '@/store';
import { SyncIndicator, Toast } from '@/components/UI';
import { NotificationCenter } from '@/components/NotificationCenter';
import { farmInfo, currentDate } from '@/data';

const navItems: { screen: ScreenName; label: string; icon: typeof Home }[] = [
  { screen: 'home', label: 'Home', icon: Home },
  { screen: 'livestock', label: 'Livestock', icon: Beef },
  { screen: 'health', label: 'Health', icon: HeartPulse },
  { screen: 'operations', label: 'Operations', icon: Briefcase },
  { screen: 'reports', label: 'Reports', icon: BarChart3 },
];

interface ShellProps {
  children: ReactNode;
  showHeader?: boolean;
  headerTitle?: string;
  showBack?: boolean;
  showProfile?: boolean;
  showNotifications?: boolean;
  rightAction?: ReactNode;
}

export function AppShell({
  children,
  showHeader = false,
  headerTitle,
  showBack,
  showProfile = true,
  showNotifications = true,
  rightAction,
}: ShellProps) {
  const {
    screen,
    navigate,
    goBack,
    syncState,
    setSyncState,
    triggerSync,
    pendingChanges,
    toast,
    setIsNotificationsOpen,
    deviceFrame,
    setDeviceFrame,
    resetData,
  } = useApp();

  const [showQuickJumper, setShowQuickJumper] = useState(false);

  const isTabScreen = ['home', 'livestock', 'health', 'operations', 'reports'].includes(screen);

  return (
    <div className="min-h-screen bg-charcoal-900 flex flex-col items-center justify-start p-0 md:py-6 md:px-4 font-sans select-none text-charcoal-700">
      {/* Top Prototype Reviewer Control Toolbar (Desktop / Tablet view) */}
      <aside aria-label="Prototype Controls" className="w-full max-w-4xl mb-4 hidden md:flex items-center justify-between px-4 py-2.5 bg-charcoal-800/90 backdrop-blur-md rounded-2xl border border-charcoal-700/80 text-white shadow-xl text-xs z-40">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-forest-300 bg-forest-900/60 px-2.5 py-1 rounded-lg border border-forest-600/40">
            <Smartphone className="w-3.5 h-3.5 text-forest-400" /> React Native Mobile Prototype
          </span>

          {/* Quick Screen Jumper Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowQuickJumper(!showQuickJumper)}
              className="px-3 py-1 bg-charcoal-700 hover:bg-charcoal-600 rounded-lg font-semibold flex items-center gap-1.5 transition-colors border border-charcoal-600"
            >
              <span>Jump: <strong className="text-white capitalize">{screen}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-charcoal-400" />
            </button>

            {showQuickJumper && (
              <div className="absolute left-0 mt-1.5 w-60 bg-charcoal-800 border border-charcoal-600 rounded-xl shadow-2xl py-1 z-50 animate-scale-in">
                {[
                  { id: 'home', label: 'Screen 1: Home Dashboard' },
                  { id: 'livestock', label: 'Screen 2: Livestock Register' },
                  { id: 'addAnimal', label: 'Screen 3: Add / Register Animal' },
                  { id: 'animalProfile', label: 'Screen 4: Animal Profile' },
                  { id: 'health', label: 'Screen 5: Health & Treatment' },
                  { id: 'operations', label: 'Screen 6: Farm Operations' },
                  { id: 'reports', label: 'Reports & Herd Performance' },
                  { id: 'settings', label: 'Settings & Farm Profile' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      navigate(s.id as ScreenName);
                      setShowQuickJumper(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between ${
                      screen === s.id ? 'bg-forest-700 text-white font-bold' : 'text-charcoal-200 hover:bg-charcoal-700'
                    }`}
                  >
                    <span>{s.label}</span>
                    {screen === s.id && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Device Frame Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-charcoal-700 p-0.5 rounded-lg border border-charcoal-600">
            <button
              onClick={() => setDeviceFrame('iphone')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                deviceFrame === 'iphone' ? 'bg-forest-700 text-white shadow-xs' : 'text-charcoal-300 hover:text-white'
              }`}
            >
              iPhone 16 Pro
            </button>
            <button
              onClick={() => setDeviceFrame('pixel')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                deviceFrame === 'pixel' ? 'bg-forest-700 text-white shadow-xs' : 'text-charcoal-300 hover:text-white'
              }`}
            >
              Pixel 9
            </button>
            <button
              onClick={() => setDeviceFrame('fullscreen')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                deviceFrame === 'fullscreen' ? 'bg-forest-700 text-white shadow-xs' : 'text-charcoal-300 hover:text-white'
              }`}
            >
              Responsive
            </button>
          </div>

          {/* Sync Trigger */}
          <button
            onClick={triggerSync}
            className="px-2.5 py-1 bg-charcoal-700 hover:bg-charcoal-600 rounded-lg text-charcoal-300 hover:text-white font-semibold flex items-center gap-1 transition-colors border border-charcoal-600"
            title="Simulate synchronization"
          >
            <Cloud className="w-3.5 h-3.5 text-forest-400" /> Sync ({pendingChanges})
          </button>

          {/* Alert Center Trigger */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-1.5 bg-charcoal-700 hover:bg-charcoal-600 rounded-lg text-amber-400 border border-charcoal-600 relative"
            title="Open Notification Center"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rust-500 rounded-full text-[9px] font-extrabold flex items-center justify-center text-white">
              3
            </span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={resetData}
            className="p-1.5 bg-charcoal-700 hover:bg-charcoal-600 rounded-lg text-charcoal-400 hover:text-white border border-charcoal-600"
            title="Reset to default prototype sample data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Mobile Device Frame Container */}
      <div
        className={`relative w-full transition-all duration-300 flex flex-col overflow-hidden ${
          deviceFrame === 'fullscreen'
            ? 'max-w-md min-h-screen bg-cream-100'
            : deviceFrame === 'pixel'
            ? 'max-w-[410px] h-[830px] max-h-[92vh] bg-cream-100 rounded-[2.5rem] border-[10px] border-charcoal-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]'
            : 'max-w-[414px] h-[844px] max-h-[92vh] bg-cream-100 rounded-[3.2rem] border-[12px] border-charcoal-800 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] ring-1 ring-charcoal-600'
        }`}
      >
        {/* Dynamic Island (iPhone) or Punch-hole Camera (Pixel) */}
        {deviceFrame === 'iphone' && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-7 bg-charcoal-900 rounded-full z-40 flex items-center justify-between px-2.5 text-charcoal-400 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-500/80 animate-pulse" />
            <span className="text-[10px] text-white/80 font-bold tracking-tight">FarmSync</span>
            <span className="w-2.5 h-2.5 rounded-full bg-charcoal-800 border border-charcoal-700" />
          </div>
        )}

        {deviceFrame === 'pixel' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-charcoal-900 rounded-full z-40 border border-charcoal-700 shadow-inner" />
        )}

        {/* Native Simulated Mobile Status Bar */}
        <div className="flex items-center justify-between px-7 pt-3.5 pb-1 text-charcoal-700 text-xs font-semibold z-30 select-none">
          <span className="text-[11px] font-bold tracking-tight">9:41</span>
          <div className="flex items-center gap-1.5">
            <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor">
              <path d="M1 9h2v2H1zM5 7h2v4H5zM9 5h2v6H9zM13 3h2v8h-2z" />
            </svg>
            <svg width="13" height="11" viewBox="0 0 14 12" fill="currentColor">
              <path d="M7 2.5C4.2 2.5 1.8 3.5 0 5.2l1 1c1.6-1.5 3.8-2.2 6-2.2s4.4.7 6 2.2l1-1C12.2 3.5 9.8 2.5 7 2.5zM7 5.5c-1.7 0-3.3.6-4.5 1.7l1 1c.9-.8 2.2-1.2 3.5-1.2s2.6.4 3.5 1.2l1-1C10.3 6.1 8.7 5.5 7 5.5zM7 8.5c-.8 0-1.5.3-2 .8L7 11l2-1.7c-.5-.5-1.2-.8-2-.8z" />
            </svg>
            <div className="flex items-center gap-0.5">
              <div className="w-5 h-2.5 rounded-xs border border-charcoal-700 relative">
                <div className="absolute inset-0.5 bg-forest-600 rounded-[1px]" style={{ width: '85%' }} />
              </div>
              <div className="w-0.5 h-1 bg-charcoal-700 rounded-r-xs" />
            </div>
          </div>
        </div>

        {/* Sub-Screen Navigation Header (For secondary views) */}
        {showHeader && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-charcoal-100 z-20">
            <div className="flex items-center gap-2.5">
              {showBack && (
                <button
                  onClick={goBack}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-200 active:scale-95 transition-transform no-tap -ml-1 text-forest-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-base font-bold text-charcoal-800">{headerTitle}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              {rightAction}
              {showNotifications && (
                <button
                  onClick={() => setIsNotificationsOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-200 text-charcoal-600 relative no-tap"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rust-500 rounded-full" />
                </button>
              )}
              {showProfile && (
                <button
                  onClick={() => navigate('settings')}
                  className="w-8 h-8 rounded-full bg-forest-700 text-white text-[11px] font-bold flex items-center justify-center shadow-xs no-tap active:scale-95 transition-transform"
                >
                  TM
                </button>
              )}
            </div>
          </div>
        )}

        {/* Persistent Field Sync Alert Ribbon (Offline or Pending Changes) */}
        {(syncState === 'Offline' || syncState === 'Pending' || syncState === 'Syncing') && (
          <div
            className={`px-4 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors z-20 ${
              syncState === 'Offline'
                ? 'bg-charcoal-200 text-charcoal-700'
                : syncState === 'Pending'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-forest-100 text-forest-800'
            }`}
          >
            <SyncIndicator state={syncState} compact />
            {syncState === 'Pending' && (
              <button onClick={triggerSync} className="underline font-bold text-[11px] text-amber-900 no-tap">
                Sync now ({pendingChanges})
              </button>
            )}
          </div>
        )}

        {/* Main Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
          {children}
        </div>

        {/* Native React Native Bottom Tab Navigation Bar */}
        {isTabScreen && (
          <nav aria-label="Main Navigation" className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-charcoal-100 px-3 pt-2 pb-5 z-30 shadow-lg">
            <div className="flex items-center justify-around">
              {navItems.map((item) => {
                const active = screen === item.screen;
                const Icon = item.icon;
                return (
                  <button
                    key={item.screen}
                    onClick={() => navigate(item.screen)}
                    className={`flex flex-col items-center gap-1 px-2.5 py-1 rounded-xl transition-all no-tap active:scale-90 ${
                      active ? 'text-forest-700' : 'text-charcoal-400 hover:text-charcoal-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                    <span className={`text-[10px] font-bold tracking-tight ${active ? 'text-forest-700' : 'text-charcoal-400'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* iOS Home Swipe Indicator Bar */}
            {deviceFrame === 'iphone' && (
              <div className="w-32 h-1 bg-charcoal-400/60 rounded-full mx-auto mt-2" />
            )}
            {deviceFrame === 'pixel' && (
              <div className="w-20 h-1 bg-charcoal-400/60 rounded-full mx-auto mt-2" />
            )}
          </nav>
        )}

        {/* Slide-out Notification & Alert Drawer */}
        <NotificationCenter />

        {/* In-App Toast Notification */}
        {toast && <Toast message={toast.message} type={toast.type} />}
      </div>
    </div>
  );
}
