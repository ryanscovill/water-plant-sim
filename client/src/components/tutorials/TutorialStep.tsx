import type { TutorialStep as TStep } from '../../types/tutorials';

interface TutorialStepProps {
  step: TStep;
  stepNumber: number;
  total: number;
}

export function TutorialStep({ step, stepNumber, total }: TutorialStepProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-blue-400 font-mono">STEP {stepNumber} OF {total}</div>
      <p className="text-white text-sm leading-relaxed">{step.instruction}</p>
      {step.hint && (
        <div className="bg-blue-900/30 border border-blue-700 rounded px-3 py-2 text-xs text-blue-300">
          <span className="font-bold">Hint:</span> {step.hint}
        </div>
      )}
    </div>
  );
}
