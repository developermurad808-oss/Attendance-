import React from 'react';
import { 
  QrCode, 
  LayoutDashboard, 
  GraduationCap, 
  Briefcase, 
  CreditCard, 
  BellRing, 
  IdCard, 
  Maximize2, 
  PlayCircle, 
  Volume2, 
  VolumeX,
  Clock,
  Building2
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLaunchKiosk: () => void;
  onSimulateRush: () => void;
  isSimulating: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  gateLocation: string;
  setGateLocation: (loc: string) => void;
  unreadNotificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLaunchKiosk,
  onSimulateRush,
  isSimulating,
  soundEnabled,
  setSoundEnabled,
  gateLocation,
  setGateLocation,
  unreadNotificationsCount,
}) => {
  const [currentTime, setCurrentTime] = React.useState<string>('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Leadership', icon: LayoutDashboard },
    { id: 'scanner', label: 'QR Scanner', icon: QrCode },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'staff', label: 'Staff & Leaves', icon: Briefcase },
    { id: 'payroll', label: 'Payroll (₦)', icon: CreditCard },
    { id: 'notifications', label: 'Parent Comms', icon: BellRing, badge: unreadNotificationsCount },
    { id: 'id-cards', label: 'ID Badges', icon: IdCard },
  ];

  return (
    <header className="sticky top-0 z-40 bg-indigo-900 border-b border-indigo-800 shadow-md">
      {/* Upper Status & Campus Strip */}
      <div className="bg-indigo-950 px-4 py-1.5 border-b border-indigo-900/80 flex items-center justify-between text-xs text-indigo-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-semibold text-amber-400">
            <Building2 className="w-3.5 h-3.5" />
            <span>Maitama Campus, Abuja (FCT Nigeria)</span>
          </div>
          <span className="hidden sm:inline text-indigo-700">|</span>
          <div className="hidden sm:flex items-center gap-1.5 text-indigo-100 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Gate Synchronization: Active</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-indigo-100 bg-indigo-900/80 px-2.5 py-0.5 rounded-lg border border-indigo-700/60">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>WAT {currentTime || '08:00:00 AM'}</span>
          </div>
          <select
            value={gateLocation}
            onChange={(e) => setGateLocation(e.target.value)}
            className="bg-indigo-900 text-indigo-100 border border-indigo-700 rounded-lg px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:border-amber-400"
          >
            <option value="Main Gate (Maitama Campus)">Main Gate (Maitama)</option>
            <option value="Junior Wing Gate">Junior Wing Gate</option>
            <option value="Staff Executive Gate">Staff Executive Gate</option>
            <option value="Hostel & Bus Turnstile">Hostel & Bus Turnstile</option>
          </select>
        </div>
      </div>

      {/* Main Bar complying with Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-3">
        {/* Brand Zone: 1 single element, no secondary subheadings underneath */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-black text-indigo-950 text-xl shadow-sm tracking-tight">
            H
          </div>
          <span className="font-bold text-white text-base sm:text-lg tracking-tight uppercase whitespace-nowrap">
            Heritage of Excellence <span className="text-indigo-950 font-sans font-black text-[10px] px-2 py-0.5 rounded-full bg-amber-400 uppercase tracking-widest ml-1 shadow-xs">Abuja</span>
          </span>
        </div>

        {/* Navigation items: 5-7 items, single-line */}
        <nav className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 relative ${
                  isActive
                    ? 'bg-white/15 text-white shadow-xs border border-white/20'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-indigo-300'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-black bg-amber-400 text-indigo-950 rounded-full shadow-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Zone: 1-2 primary controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Scan Chimes' : 'Enable Scan Chimes'}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-indigo-800 text-amber-400 border-indigo-700 hover:bg-indigo-700'
                : 'bg-indigo-950 text-indigo-400 border-indigo-900 hover:text-indigo-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={onSimulateRush}
            disabled={isSimulating}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap shrink-0 ${
              isSimulating
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 animate-pulse'
                : 'bg-indigo-800/80 hover:bg-indigo-700 text-white border-indigo-700'
            }`}
          >
            <PlayCircle className="w-4 h-4 text-amber-400" />
            <span>{isSimulating ? 'Simulating...' : 'Simulate Rush'}</span>
          </button>

          <button
            onClick={onLaunchKiosk}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 rounded-xl text-xs font-black transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Gate Terminal</span>
            <span className="sm:hidden">Kiosk</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-t border-indigo-800 bg-indigo-950">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white/20 text-white font-bold'
                  : 'text-indigo-200 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1 text-[9px] font-black bg-amber-400 text-indigo-950 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
