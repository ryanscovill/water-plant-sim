import { BookOpen, Play } from 'lucide-react';
import type { TutorialInfo, Tutorial } from '../types/tutorials';
import { useTutorialStore } from '../store/useTutorialStore';
import {
  startupProcedure,
  alarmResponse,
  backwashProcedure,
  chlorinationAdjustment,
} from '../simulation/tutorials/index';
import type { TutorialDefinition } from '../simulation/tutorials/index';

const ALL_TUTORIALS: TutorialDefinition[] = [
  startupProcedure,
  alarmResponse,
  backwashProcedure,
  chlorinationAdjustment,
];

const TUTORIAL_INFOS: TutorialInfo[] = ALL_TUTORIALS.map((t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  stepCount: t.steps.length,
}));

export function TutorialsPage() {
  const { startTutorial, activeTutorial, exitTutorial } = useTutorialStore();

  const launch = (id: string) => {
    const def = ALL_TUTORIALS.find((t) => t.id === id);
    if (!def) return;
    const tutorial: Tutorial = {
      id: def.id,
      title: def.title,
      description: def.description,
      stepCount: def.steps.length,
      steps: def.steps,
    };
    startTutorial(tutorial);
    def.onStart?.();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-gray-300 font-bold text-sm font-mono">OPERATOR TUTORIALS</h2>
      <p className="text-gray-500 text-xs">
        Step-by-step guided tutorials for key plant operations. Follow the highlighted elements to learn procedures.
      </p>

      {activeTutorial && (
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-blue-300 font-bold text-sm">{activeTutorial.title}</div>
            <div className="text-blue-400 text-xs">Tutorial in progress</div>
          </div>
          <button onClick={exitTutorial} className="text-blue-400 hover:text-blue-300 text-xs">Exit</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TUTORIAL_INFOS.map((t) => (
          <div key={t.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors">
            <div className="flex items-start gap-3">
              <BookOpen className="text-blue-400 mt-0.5 shrink-0" size={18} />
              <div className="flex-1">
                <h3 className="text-white font-bold text-sm mb-1">{t.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-3">{t.description}</p>
                <div className="text-gray-500 text-xs mb-3">{t.stepCount} steps</div>
                <button
                  onClick={() => launch(t.id)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded font-semibold"
                >
                  <Play size={12} /> START TUTORIAL
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
