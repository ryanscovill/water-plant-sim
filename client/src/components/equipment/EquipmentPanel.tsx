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
    <div className="bg-gray-950 border border-gray-700 rounded-lg flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900 rounded-t-lg">
        <div>
          <div className="text-white font-bold text-sm">{title}</div>
          <div className="text-gray-300 text-xs font-mono">{tag}</div>
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

export function UnsavedChangesDialog({ onDiscard, onCancel }: { onDiscard: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 w-72 shadow-xl">
        <div className="text-white font-bold text-sm mb-1">Unsaved Changes</div>
        <div className="text-gray-400 text-sm mb-4">You have unapplied setpoint changes. Discard them?</div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm rounded font-semibold"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyPanel() {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg flex flex-col items-center justify-center h-full min-h-48 text-center p-6">
      <MousePointer size={28} className="text-gray-400 mb-3" />
      <div className="text-gray-300 text-sm font-mono">Click a feature</div>
      <div className="text-gray-300 text-sm font-mono">to modify</div>
    </div>
  );
}
