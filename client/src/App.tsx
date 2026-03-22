import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LandingLayout } from './components/layout/LandingLayout';
import { LandingPage } from './pages/LandingPage';
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
import { WWPlaceholderPage } from './pages/WWPlaceholderPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — minimal layout, no sidebar */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Drinking Water simulator */}
        <Route path="/dw" element={<AppShell simulatorType="dw" />}>
          <Route index element={<Navigate to="intake" replace />} />
          <Route path="intake" element={<IntakePage />} />
          <Route path="coagulation" element={<CoagFloccPage />} />
          <Route path="sedimentation" element={<SedimentationPage />} />
          <Route path="disinfection" element={<DisinfectionPage />} />
          <Route path="alarms" element={<AlarmsPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="scenarios" element={<ScenariosPage />} />
          <Route path="tutorials" element={<TutorialsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Waste Water simulator (placeholder) */}
        <Route path="/ww" element={<AppShell simulatorType="ww" />}>
          <Route index element={<Navigate to="headworks" replace />} />
          <Route path="headworks" element={<WWPlaceholderPage stage="Headworks" />} />
          <Route path="primary" element={<WWPlaceholderPage stage="Primary Clarification" />} />
          <Route path="aeration" element={<WWPlaceholderPage stage="Aeration" />} />
          <Route path="secondary" element={<WWPlaceholderPage stage="Secondary Clarification" />} />
          <Route path="disinfection" element={<WWPlaceholderPage stage="Disinfection" />} />
          <Route path="alarms" element={<WWPlaceholderPage stage="Alarms" />} />
          <Route path="trends" element={<WWPlaceholderPage stage="Trends" />} />
          <Route path="history" element={<WWPlaceholderPage stage="History" />} />
          <Route path="scenarios" element={<WWPlaceholderPage stage="Scenarios" />} />
          <Route path="tutorials" element={<WWPlaceholderPage stage="Tutorials" />} />
          <Route path="settings" element={<WWPlaceholderPage stage="Settings" />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
