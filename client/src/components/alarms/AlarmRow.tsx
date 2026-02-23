import { Check } from 'lucide-react';
import type { Alarm } from '../../types/process';
import { getEngine } from '../../simulation/engine';
import { useNavigate } from 'react-router-dom';

interface AlarmRowProps {
  alarm: Alarm;
}

const priorityStyles: Record<string, string> = {
  CRITICAL: 'border-l-red-500 bg-red-950/30 animate-flash',
  HIGH: 'border-l-amber-500 bg-amber-950/30 animate-slow-flash',
  MEDIUM: 'border-l-yellow-500 bg-yellow-950/20',
  LOW: 'border-l-blue-500 bg-blue-950/20',
};

const priorityBadge: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH: 'bg-amber-600 text-white',
  MEDIUM: 'bg-yellow-600 text-black',
  LOW: 'bg-blue-600 text-white',
};

function tagToRoute(tag: string): string {
  if (tag.startsWith('INT-')) return '/intake';
  if (tag.startsWith('COG-')) return '/coagulation';
  if (tag.startsWith('SED-') || tag.startsWith('FLT-')) return '/sedimentation';
  if (tag.startsWith('DIS-')) return '/disinfection';
  return '/';
}

export function AlarmRow({ alarm }: AlarmRowProps) {
  const navigate = useNavigate();

  const ack = (e: React.MouseEvent) => {
    e.stopPropagation();
    getEngine().applyControl('acknowledgeAlarm', { alarmId: alarm.id });
  };

  const time = new Date(alarm.timestamp).toLocaleTimeString();
  const isHigh = alarm.condition === 'H' || alarm.condition === 'HH';
  const arrow = isHigh ? '↑' : '↓';
  const op = isHigh ? '>' : '<';

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 border-l-4 cursor-pointer hover:brightness-125 ${alarm.acknowledged ? 'opacity-60' : ''} ${priorityStyles[alarm.priority] || ''}`}
      onClick={() => navigate(tagToRoute(alarm.tag))}
    >
      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${priorityBadge[alarm.priority]}`}>
        {alarm.condition}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-white font-mono truncate">{alarm.description}</span>
          <span className="text-sm font-mono font-bold text-white">{arrow} {alarm.value.toFixed(2)}</span>
          <span className="text-xs text-gray-400 font-mono">{op} {alarm.setpoint.toFixed(2)}</span>
        </div>
        <div className="text-xs text-gray-400 font-mono">
          {alarm.tag} &bull; {time}
        </div>
      </div>
      {!alarm.acknowledged && (
        <button
          id="alarm-ack-button"
          onClick={ack}
          className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-200 whitespace-nowrap"
        >
          <Check size={12} /> ACK
        </button>
      )}
      {alarm.acknowledged && (
        <span className="text-xs text-gray-500 font-mono">ACK</span>
      )}
    </div>
  );
}
