import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useTutorialStore } from './store/useTutorialStore'

// Expose tutorial store helper for Playwright integration tests (dev only)
if (import.meta.env.DEV) {
  (window as any).__tutorialNextStep = () => useTutorialStore.getState().nextStep();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
