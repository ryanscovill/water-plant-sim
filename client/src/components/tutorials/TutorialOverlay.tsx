import { ChevronRight, ChevronLeft, X, CheckCircle } from 'lucide-react';
import { useTutorialStore } from '../../store/useTutorialStore';
import { TutorialStep } from './TutorialStep';
import { TutorialProgress } from './TutorialProgress';

export function TutorialOverlay() {
  const { activeTutorial, currentStep, completed, nextStep, prevStep, exitTutorial } = useTutorialStore();

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
              <div className="flex gap-2 mt-4">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 text-xs rounded"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded font-semibold"
                >
                  {currentStep === activeTutorial.steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={14} />
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Spotlight highlight */}
      {step?.spotlight && (
        <style>{`
          #${step.spotlight} {
            outline: 3px solid #3b82f6 !important;
            outline-offset: 4px;
            border-radius: 4px;
            animation: spotlight-pulse 1.5s ease-in-out infinite;
          }
          @keyframes spotlight-pulse {
            0%, 100% { outline-color: #3b82f6; }
            50% { outline-color: #93c5fd; }
          }
        `}</style>
      )}
    </>
  );
}
