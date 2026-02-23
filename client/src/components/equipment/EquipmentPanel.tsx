import { X, MousePointer, Info } from 'lucide-react';

interface EquipmentPanelProps {
  title: string;
  tag: string;
  onClose: () => void;
  onInfo?: () => void;
  children: React.ReactNode;
}

export function EquipmentPanel({ title, tag, onClose, onInfo, children }: EquipmentPanelProps) {
  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900 rounded-t-lg">
        <div>
          <div className="text-white font-bold text-sm">{title}</div>
          <div className="text-gray-400 text-xs font-mono">{tag}</div>
        </div>
        <div className="flex items-center gap-1">
          {onInfo && (
            <button
              onClick={onInfo}
              title="What is this?"
              className="text-blue-400 hover:text-blue-200 p-1 rounded hover:bg-gray-700"
            >
              <Info size={16} />
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

export function EmptyPanel() {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg flex flex-col items-center justify-center h-full min-h-48 text-center p-6">
      <MousePointer size={28} className="text-gray-600 mb-3" />
      <div className="text-gray-500 text-sm font-mono">Click a feature</div>
      <div className="text-gray-500 text-sm font-mono">to modify</div>
    </div>
  );
}
