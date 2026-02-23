import { useTutorialStore } from '../../store/useTutorialStore';

export function TutorialProgress() {
  const { activeTutorial, currentStep } = useTutorialStore();
  if (!activeTutorial) return null;

  const total = activeTutorial.steps.length;

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < currentStep ? 'bg-green-500 w-4'
            : i === currentStep ? 'bg-blue-400 w-6'
            : 'bg-gray-600 w-3'
          }`}
        />
      ))}
      <span className="text-xs text-gray-400 ml-2">{currentStep + 1}/{total}</span>
    </div>
  );
}
