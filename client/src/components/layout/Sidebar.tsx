import { NavLink, useNavigate } from 'react-router-dom';
import {
  Droplets, FlaskConical, Layers, Waves,
  Bell, TrendingUp, Play, BookOpen, History, Settings,
  Home, Beaker, Wind, Filter,
} from 'lucide-react';
import { useAlarmStore } from '../../store/useAlarmStore';
import type { SimulatorType } from './AppShell';

type NavItem = { to: string; label: string; icon: React.ComponentType<{ size?: number }>; id: string } | null;

const dwNavItems: NavItem[] = [
  { to: 'intake', label: 'Intake', icon: Droplets, id: 'nav-intake' },
  { to: 'coagulation', label: 'Coagulation', icon: FlaskConical, id: 'nav-coagulation' },
  { to: 'sedimentation', label: 'Sedimentation', icon: Layers, id: 'nav-sedimentation' },
  { to: 'disinfection', label: 'Disinfection', icon: Waves, id: 'nav-disinfection' },
  null,
  { to: 'alarms', label: 'Alarms', icon: Bell, id: 'nav-alarms' },
  { to: 'trends', label: 'Trends', icon: TrendingUp, id: 'nav-trends' },
  { to: 'history', label: 'History', icon: History, id: 'nav-history' },
  { to: 'scenarios', label: 'Scenarios', icon: Play, id: 'nav-scenarios' },
  { to: 'tutorials', label: 'Tutorials', icon: BookOpen, id: 'nav-tutorials' },
  null,
  { to: 'settings', label: 'Settings', icon: Settings, id: 'nav-settings' },
];

const wwNavItems: NavItem[] = [
  { to: 'headworks', label: 'Headworks', icon: Filter, id: 'nav-headworks' },
  { to: 'primary', label: 'Primary', icon: Layers, id: 'nav-primary' },
  { to: 'aeration', label: 'Aeration', icon: Wind, id: 'nav-aeration' },
  { to: 'secondary', label: 'Secondary', icon: Beaker, id: 'nav-secondary' },
  { to: 'disinfection', label: 'Disinfection', icon: Waves, id: 'nav-disinfection' },
  null,
  { to: 'alarms', label: 'Alarms', icon: Bell, id: 'nav-ww-alarms' },
  { to: 'trends', label: 'Trends', icon: TrendingUp, id: 'nav-ww-trends' },
  { to: 'history', label: 'History', icon: History, id: 'nav-ww-history' },
  { to: 'scenarios', label: 'Scenarios', icon: Play, id: 'nav-ww-scenarios' },
  { to: 'tutorials', label: 'Tutorials', icon: BookOpen, id: 'nav-ww-tutorials' },
  null,
  { to: 'settings', label: 'Settings', icon: Settings, id: 'nav-ww-settings' },
];

export function Sidebar({ simulatorType }: { simulatorType: SimulatorType }) {
  const navigate = useNavigate();
  const alarms = useAlarmStore((s) => s.alarms);
  const unacked = alarms.filter((a) => a.active).length;
  const navItems = simulatorType === 'dw' ? dwNavItems : wwNavItems;

  return (
    <nav className="w-44 bg-gray-900 border-r border-gray-700 flex flex-col py-2 shrink-0">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2.5 px-3 py-2 mx-1 rounded text-sm text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors cursor-pointer mb-1"
      >
        <Home size={15} />
        <span>Home</span>
      </button>
      <div className="border-t border-gray-800 my-1 mx-3" />
      {navItems.map((item, i) => {
        if (!item) return <div key={i} className="border-t border-gray-800 my-2 mx-3" />;
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            id={item.id}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 mx-1 rounded text-sm transition-colors ${
                isActive
                  ? 'bg-blue-900/50 text-blue-300 font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`
            }
          >
            <Icon size={15} />
            <span>{item.label}</span>
            {simulatorType === 'dw' && item.to === 'alarms' && unacked > 0 && (
              <span className="ml-auto bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full animate-flash">
                {unacked}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
