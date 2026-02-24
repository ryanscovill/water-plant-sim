import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { IntakePage } from './pages/IntakePage';
import { CoagFloccPage } from './pages/CoagFloccPage';
import { SedimentationPage } from './pages/SedimentationPage';
import { DisinfectionPage } from './pages/DisinfectionPage';
import { AlarmsPage } from './pages/AlarmsPage';
import { TrendsPage } from './pages/TrendsPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { TutorialsPage } from './pages/TutorialsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/coagulation" element={<CoagFloccPage />} />
          <Route path="/sedimentation" element={<SedimentationPage />} />
          <Route path="/disinfection" element={<DisinfectionPage />} />
          <Route path="/alarms" element={<AlarmsPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/tutorials" element={<TutorialsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
