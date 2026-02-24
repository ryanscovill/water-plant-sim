import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, ChevronLeft, X, CheckCircle } from 'lucide-react';
import { useTutorialStore } from '../../store/useTutorialStore';
import { useSimulationStore } from '../../store/useSimulationStore';
import { useAlarmStore } from '../../store/useAlarmStore';
import { TutorialStep } from './TutorialStep';
import { TutorialProgress } from './TutorialProgress';
import type { ProcessState, Alarm } from '../../types/process';

function evaluateWaitFor(condition: string, processState: ProcessState, alarms: Alarm[]): boolean {
  try {
    const fn = new Function(
      'intake', 'coagulation', 'sedimentation', 'disinfection', 'alarms',
      `return !!(${condition});`
    );
    return fn(
      processState.intake,
      processState.coagulation,
      processState.sedimentation,
      processState.disinfection,
      alarms
    );
  } catch {
    return false;
  }
}

function navSpotlightToPath(spotlight: string): string | null {
  if (!spotlight.startsWith('nav-')) return null;
  const section = spotlight.replace('nav-', '');
  return section === 'overview' ? '/' : `/${section}`;
}

export function TutorialOverlay() {
  const { activeTutorial, currentStep, completed, nextStep, prevStep, exitTutorial } = useTutorialStore();
  const processState = useSimulationStore((s) => s.state);
  const alarms = useAlarmStore((s) => s.alarms);
  const location = useLocation();

  // Prevent double-advancing on the same step
  const autoAdvancedRef = useRef(false);
  useEffect(() => {
    autoAdvancedRef.current = false;
  }, [currentStep]);

  // Auto-advance: waitFor condition met
  useEffect(() => {
    if (!activeTutorial || completed || autoAdvancedRef.current) return;
    const step = activeTutorial.steps[currentStep];
    if (!step?.waitFor || !processState) return;
    if (evaluateWaitFor(step.waitFor, processState, alarms)) {
      autoAdvancedRef.current = true;
      nextStep();
    }
  }, [processState, alarms, activeTutorial, currentStep, completed, nextStep]);

  // Auto-advance: user navigated to the spotlighted nav destination
  useEffect(() => {
    if (!activeTutorial || completed || autoAdvancedRef.current) return;
    const step = activeTutorial.steps[currentStep];
    if (!step || step.waitFor) return;
    const targetPath = navSpotlightToPath(step.spotlight);
    if (targetPath && location.pathname === targetPath) {
      autoAdvancedRef.current = true;
      nextStep();
    }
  }, [location.pathname, activeTutorial, currentStep, completed, nextStep]);

  // Auto-advance: user clicked an interactive HMI element spotlighted by this step
  useEffect(() => {
    if (!activeTutorial || completed) return;
    const step = activeTutorial.steps[currentStep];
    if (!step || step.waitFor || navSpotlightToPath(step.spotlight)) return;

    const handleClick = (e: MouseEvent) => {
      if (autoAdvancedRef.current) return;
      const target = e.target as Element;
      const spotlightEl = document.getElementById(step.spotlight);
      if (!spotlightEl?.contains(target)) return;

      // Only advance for genuinely interactive elements, not read-only displays
      const isInteractive =
        spotlightEl.getAttribute('data-interactive') === 'true' ||
        target.closest('[data-interactive="true"]') !== null ||
        target instanceof HTMLButtonElement ||
        target.closest('button') !== null ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLInputElement;

      if (isInteractive) {
        autoAdvancedRef.current = true;
        nextStep();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeTutorial, currentStep, completed, nextStep]);

  if (!activeTutorial) return null;

  const step = activeTutorial.steps[currentStep];

  return (
    <>
      {/* Overlay card */}
      <div className="fixed bottom-12 right-4 w-80 bg-gray-800 border border-blue-600 rounded-xl shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-900/40 border-b border-blue-700">
          <div>
            <div className="text-white font-bold text-xs">{activeTutorial.title}</div>
            <TutorialProgress />
          </div>
          <button onClick={exitTutorial} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {completed ? (
            <div className="text-center space-y-3">
              <CheckCircle className="mx-auto text-green-400" size={36} />
              <div className="text-white font-bold">Tutorial Complete!</div>
              <p className="text-gray-400 text-xs">You've completed "{activeTutorial.title}"</p>
              <button
                onClick={exitTutorial}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white text-sm rounded w-full"
              >
                FINISH
              </button>
            </div>
          ) : step ? (
            <>
              <TutorialStep step={step} stepNumber={currentStep + 1} total={activeTutorial.steps.length} />
              {step.waitFor && (
                <div className="mt-3 flex items-center gap-1.5 text-amber-400 text-xs">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Waiting for action…
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 text-xs rounded cursor-pointer"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                {(() => {
                  const isLast = currentStep === activeTutorial.steps.length - 1;
                  const autoAdvances = !!step.waitFor || !!step.clickToAdvance || !!navSpotlightToPath(step.spotlight);
                  if (autoAdvances && !isLast) return null;
                  return (
                    <button
                      onClick={nextStep}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded font-semibold cursor-pointer"
                    >
                      {isLast ? 'Finish' : 'Next'} <ChevronRight size={14} />
                    </button>
                  );
                })()}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Spotlight highlight — filter: drop-shadow works on both HTML and SVG elements */}
      {step?.spotlight && (
        <style>{`
          #${step.spotlight} {
            outline: 3px solid #3b82f6 !important;
            outline-offset: 4px;
            border-radius: 4px;
            animation: spotlight-pulse 1.5s ease-in-out infinite;
          }
          @keyframes spotlight-pulse {
            0%, 100% {
              outline-color: #3b82f6;
              filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.7));
            }
            50% {
              outline-color: #93c5fd;
              filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 14px rgba(147, 197, 253, 0.8));
            }
          }
        `}</style>
      )}
    </>
  );
}
