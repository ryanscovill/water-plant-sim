import { NavLink } from 'react-router-dom';
import {
  Droplets, FlaskConical, Layers, Waves,
  Bell, TrendingUp, Play, BookOpen, History, Settings,
} from 'lucide-react';
import { useAlarmStore } from '../../store/useAlarmStore';

const navItems = [
  { to: '/intake', label: 'Intake', icon: Droplets, id: 'nav-intake' },
  { to: '/coagulation', label: 'Coagulation', icon: FlaskConical, id: 'nav-coagulation' },
  { to: '/sedimentation', label: 'Sedimentation', icon: Layers, id: 'nav-sedimentation' },
  { to: '/disinfection', label: 'Disinfection', icon: Waves, id: 'nav-disinfection' },
  null, // divider
  { to: '/alarms', label: 'Alarms', icon: Bell, id: 'nav-alarms' },
  { to: '/trends', label: 'Trends', icon: TrendingUp, id: 'nav-trends' },
  { to: '/history', label: 'History', icon: History, id: 'nav-history' },
  { to: '/scenarios', label: 'Scenarios', icon: Play, id: 'nav-scenarios' },
  { to: '/tutorials', label: 'Tutorials', icon: BookOpen, id: 'nav-tutorials' },
  null, // divider
  { to: '/settings', label: 'Settings', icon: Settings, id: 'nav-settings' },
];

export function Sidebar() {
  const alarms = useAlarmStore((s) => s.alarms);
  const unacked = alarms.filter((a) => a.active).length;

  return (
    <nav className="w-44 bg-gray-900 border-r border-gray-700 flex flex-col py-2 shrink-0">
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
            {item.to === '/alarms' && unacked > 0 && (
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
