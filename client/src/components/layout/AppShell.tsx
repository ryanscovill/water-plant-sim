import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { AlarmBanner } from '../alarms/AlarmBanner';
import { useSocket } from '../../hooks/useSocket';
import { useAlarmSound } from '../../hooks/useAlarmSound';
import { useTutorialStore } from '../../store/useTutorialStore';
import { TutorialOverlay } from '../tutorials/TutorialOverlay';

export function AppShell() {
  useSocket();
  useAlarmSound();

  const activeTutorial = useTutorialStore((s) => s.activeTutorial);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">
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
    </div>
  );
}
