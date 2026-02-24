import { useEffect } from 'react';
import { X, BookOpen, AlertCircle, Settings, FlaskConical, Database, ExternalLink } from 'lucide-react';
import { hmiInfo, type HmiInfo } from '../../data/hmiInfo';
import { getEngine } from '../../simulation/engine';

interface InfoModalProps {
  infoKey: string;
  onClose: () => void;
}

const categoryConfig: Record<HmiInfo['category'], { color: string; bg: string; icon: React.ReactNode }> = {
  Equipment: { color: 'text-cyan-400', bg: 'bg-cyan-900/40 border-cyan-700', icon: <Settings size={13} /> },
  Instrument: { color: 'text-emerald-400', bg: 'bg-emerald-900/40 border-emerald-700', icon: <BookOpen size={13} /> },
  Process: { color: 'text-blue-400', bg: 'bg-blue-900/40 border-blue-700', icon: <AlertCircle size={13} /> },
  Chemical: { color: 'text-purple-400', bg: 'bg-purple-900/40 border-purple-700', icon: <FlaskConical size={13} /> },
  Storage: { color: 'text-amber-400', bg: 'bg-amber-900/40 border-amber-700', icon: <Database size={13} /> },
};

export function InfoModal({ infoKey, onClose }: InfoModalProps) {
  const info = hmiInfo[infoKey];

  useEffect(() => {
    getEngine().pause();
    return () => { getEngine().resume(); };
  }, []);

  if (!info) return null;

  const cat = categoryConfig[info.category];

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto"
      style={{ paddingTop: '4rem' }}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full shadow-2xl mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border ${cat.bg} ${cat.color}`}>
                {cat.icon}
                {info.category}
              </span>
            </div>
            <h2 className="text-white font-bold text-base leading-tight">{info.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-2.5 rounded hover:bg-gray-700 ml-4 shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — two-column layout */}
        <div className="flex gap-0 divide-x divide-gray-700">
          {/* Left column: image + description + why it matters */}
          <div className="flex-1 px-5 py-4 space-y-4 min-w-0">
            {info.imageUrl && (
              <div className="rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={info.imageUrl}
                  alt={info.title}
                  className="w-full object-cover max-h-48"
                />
                {info.referenceUrl && (
                  <div className="bg-gray-800 px-3 py-1.5 flex items-center justify-between">
                    <span className="text-gray-500 text-xs font-mono">Reference</span>
                    <a
                      href={info.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-mono cursor-pointer"
                    >
                      Wikipedia <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1.5">What is this?</div>
              <p className="text-gray-200 text-sm leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{info.description}</p>
            </div>

            <div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1.5">Why it matters</div>
              <p className="text-gray-200 text-sm leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{info.whyItMatters}</p>
            </div>
          </div>

          {/* Right column: key parameters + operator tips */}
          <div className="flex-1 px-5 py-4 space-y-4 min-w-0">
            <div>
              <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">Key parameters</div>
              <div className="space-y-1.5">
                {info.keyParameters.map((p, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 text-xs font-mono shrink-0 pt-0.5">{p.name}</span>
                    </div>
                    <span className="text-cyan-300 text-xs font-mono font-semibold">{p.range}</span>
                    {p.note && (
                      <div className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{p.note}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {info.operatorTips && info.operatorTips.length > 0 && (
              <div>
                <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-2">Operator tips</div>
                <ul className="space-y-2">
                  {info.operatorTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                      <span className="text-amber-400 mt-0.5 shrink-0">›</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 border-t border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg font-mono cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
