import { useNavigate } from 'react-router-dom';
import { Droplets, Factory } from 'lucide-react';

const simulators = [
  {
    title: 'Drinking Water Treatment',
    description: 'Operate a full surface water treatment plant — intake, coagulation, sedimentation, filtration, and disinfection.',
    icon: Droplets,
    path: '/dw/intake',
    color: 'border-blue-600 hover:border-blue-400',
    iconColor: 'text-blue-400',
    badge: 'Active',
    badgeColor: 'bg-green-700 text-green-200',
    enabled: true,
  },
  {
    title: 'Wastewater Treatment',
    description: 'Operate a municipal wastewater treatment facility — headworks, primary & secondary clarification, aeration, and disinfection.',
    icon: Factory,
    path: '/ww/headworks',
    color: 'border-gray-600 hover:border-gray-500',
    iconColor: 'text-gray-400',
    badge: 'Coming Soon',
    badgeColor: 'bg-gray-700 text-gray-400',
    enabled: true,
  },
] as const;

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="flex items-center gap-3 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
          <rect width="32" height="32" rx="6" fill="#1a1a2e"/>
          <path d="M16 5 C16 5 8 14 8 19 a8 8 0 0 0 16 0 C24 14 16 5 16 5Z" fill="#38bdf8"/>
          <ellipse cx="13" cy="17" rx="2" ry="3" fill="white" opacity="0.25" transform="rotate(-20 13 17)"/>
          <path d="M22 10 a9 9 0 0 1 0 12" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
          <path d="M24 8 a12 12 0 0 1 0 16" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
        </svg>
        <h1 className="text-white font-bold text-lg tracking-wider">WATERWORKS SCADA TRAINER</h1>
      </div>
      <p className="text-gray-500 text-sm mb-10">Select a simulator to begin</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        {simulators.map((sim) => {
          const Icon = sim.icon;
          return (
            <button
              key={sim.title}
              onClick={() => navigate(sim.path)}
              className={`border rounded-lg p-6 text-left transition-all cursor-pointer bg-gray-900/60 hover:bg-gray-900 ${sim.color}`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon size={28} className={sim.iconColor} />
                <span className={`text-xs font-mono px-2 py-0.5 rounded ${sim.badgeColor}`}>
                  {sim.badge}
                </span>
              </div>
              <h2 className="text-white font-bold text-base mb-2">{sim.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{sim.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
