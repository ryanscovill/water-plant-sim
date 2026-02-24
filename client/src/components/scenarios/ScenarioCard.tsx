import { Play, Square, Check, X, Clock } from 'lucide-react';
import type { ScenarioInfo } from '../../types/scenarios';

interface ScenarioCardProps {
  scenario: ScenarioInfo;
  conditionStatuses?: boolean[];
  onStart: () => void;
  onStop: () => void;
}

const difficultyColor: Record<string, string> = {
  Beginner:     'bg-green-800 text-green-200',
  Intermediate: 'bg-amber-800 text-amber-200',
  Advanced:     'bg-red-900 text-red-200',
};

export function ScenarioCard({ scenario, conditionStatuses, onStart, onStop }: ScenarioCardProps) {
  return (
    <div className={`border rounded-lg overflow-hidden ${scenario.active ? 'border-amber-500 bg-amber-950/20' : 'border-gray-700 bg-gray-900'}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-white font-bold text-sm">{scenario.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded font-semibold whitespace-nowrap ${difficultyColor[scenario.difficulty]}`}>
            {scenario.difficulty}
          </span>
        </div>

        <p className="text-gray-400 text-xs leading-relaxed mb-3">{scenario.description}</p>

        {/* Completion conditions */}
        <div className="bg-gray-950/60 rounded border border-gray-800 p-2 mb-3 space-y-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock size={10} className="text-gray-500" />
            <span className="text-gray-500 text-xs font-mono">
              {scenario.simSpeed}× · Complete after T+{scenario.minTime}s with no alarms:
            </span>
          </div>
          {scenario.completionConditionDescriptions.map((desc, i) => {
            const passed = conditionStatuses?.[i];
            const isActive = scenario.active && conditionStatuses != null;
            return (
              <div key={i} className="flex items-center gap-1.5">
                {isActive ? (
                  passed
                    ? <Check size={10} className="text-green-400 shrink-0" />
                    : <X size={10} className="text-red-400 shrink-0" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-sm border border-gray-600 shrink-0" />
                )}
                <span className={`text-xs font-mono ${isActive ? (passed ? 'text-green-300' : 'text-red-300') : 'text-gray-500'}`}>
                  {desc}
                </span>
              </div>
            );
          })}
        </div>

        {scenario.duration > 0 && (
          <p className="text-gray-500 text-xs mb-3">Scenario duration: {Math.floor(scenario.duration / 60)} min</p>
        )}

        {scenario.active ? (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded w-full justify-center font-semibold cursor-pointer"
          >
            <Square size={14} /> STOP SCENARIO
          </button>
        ) : (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded w-full justify-center font-semibold cursor-pointer"
          >
            <Play size={14} /> START SCENARIO
          </button>
        )}
      </div>
    </div>
  );
}
