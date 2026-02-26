import { X, Navigation, Activity, Sliders, Bell, Zap, BookOpen } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

const steps = [
  {
    icon: <Navigation size={16} className="text-cyan-400 shrink-0 mt-0.5" />,
    label: 'Sidebar',
    text: 'Navigate between plant stages — Intake → Coag/Flocc → Sedimentation → Disinfection',
  },
  {
    icon: <Activity size={16} className="text-green-400 shrink-0 mt-0.5" />,
    label: 'Status Bar',
    text: 'Monitor live process values (flow, turbidity, pH, chlorine) at the bottom of every screen',
  },
  {
    icon: <Sliders size={16} className="text-blue-400 shrink-0 mt-0.5" />,
    label: 'Equipment Panel',
    text: 'Control pumps, valves, and chemical dosing — click any equipment item on an HMI diagram',
  },
  {
    icon: <Bell size={16} className="text-amber-400 shrink-0 mt-0.5" />,
    label: 'Alarms',
    text: 'Watch the alarm banner and the alarm count in the nav bar; acknowledge and respond to process upsets',
  },
  {
    icon: <Zap size={16} className="text-yellow-400 shrink-0 mt-0.5" />,
    label: 'Scenarios',
    text: 'Run a Scenario to practice responding to realistic process upsets under timed conditions',
  },
  {
    icon: <BookOpen size={16} className="text-purple-400 shrink-0 mt-0.5" />,
    label: 'Tutorials',
    text: 'Follow guided Tutorials for step-by-step walkthroughs of plant operations',
  },
];

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-700">
          <div>
            <div className="text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">Water Treatment Plant</div>
            <h2 className="text-white font-bold text-lg leading-tight">SCADA Simulator</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-2 rounded hover:bg-gray-700 ml-4 shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <p className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            This simulator models a full-scale municipal water treatment plant running entirely in your browser.
            All process physics, alarms, and controls are simulated in real time — no backend required.
          </p>

          <div>
            <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-3">Quick Start</div>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-gray-500 text-xs font-mono w-4 shrink-0 mt-0.5">{i + 1}.</span>
                  {step.icon}
                  <span className="text-gray-200 text-sm leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    <span className="text-white font-semibold">{step.label}</span> — {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-cyan-700 hover:bg-cyan-600 text-white text-sm rounded-lg font-mono tracking-wider cursor-pointer"
          >
            GET STARTED
          </button>
        </div>
      </div>
    </div>
  );
}
