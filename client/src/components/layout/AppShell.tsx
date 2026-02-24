import { CheckCircle } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { AlarmBanner } from '../alarms/AlarmBanner';
import { useSocket } from '../../hooks/useSocket';
import { useAlarmSound } from '../../hooks/useAlarmSound';
import { useTutorialStore } from '../../store/useTutorialStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useScenarioStore } from '../../store/useScenarioStore';
import { TutorialOverlay } from '../tutorials/TutorialOverlay';

export function AppShell() {
  useSocket();
  useAlarmSound();

  const activeTutorial = useTutorialStore((s) => s.activeTutorial);
  const running = useSimulationStore((s) => s.state?.running ?? true);
  const completedScenarioName = useScenarioStore((s) => s.completedScenarioName);
  const completedScenarioConditions = useScenarioStore((s) => s.completedScenarioConditions);
  const setCompletedScenario = useScenarioStore((s) => s.setCompletedScenario);

  return (
    <div className={`flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden${running ? '' : ' sim-paused'}`}>
      <Navbar />
      <AlarmBanner />
      <div id="content-panel-root" className="relative flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
      <StatusBar />
      {activeTutorial && <TutorialOverlay />}

      {completedScenarioName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 border border-green-600 rounded-lg p-8 w-96 shadow-xl text-center">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-green-400 font-bold text-sm tracking-widest mb-2">SCENARIO COMPLETE</h2>
            <p className="text-white font-semibold text-base mb-3">{completedScenarioName}</p>
            {completedScenarioConditions.length > 0 && (
              <div className="bg-gray-950/60 rounded border border-green-900 p-3 mb-4 space-y-1.5 text-left">
                {completedScenarioConditions.map((desc, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={12} className="text-green-400 shrink-0" />
                    <span className="text-green-300 text-xs font-mono">{desc}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-gray-400 text-xs mb-6">All alarms cleared. The plant is operating within normal parameters.</p>
            <button
              onClick={() => setCompletedScenario(null)}
              className="px-6 py-2 rounded text-sm font-mono bg-green-700 text-green-100 hover:bg-green-600 cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
