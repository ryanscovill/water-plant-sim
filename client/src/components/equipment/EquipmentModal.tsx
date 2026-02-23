import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface EquipmentModalProps {
  title: string;
  tag: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function EquipmentModal({ title, tag, onClose, children }: EquipmentModalProps) {
  const root = document.getElementById('content-panel-root');

  const panel = (
    <div className="absolute inset-0 z-40 flex justify-end" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />
      {/* Panel */}
      <div
        className="relative bg-gray-800 border-l border-gray-600 w-80 h-full shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-900">
          <div>
            <div className="text-white font-bold text-sm">{title}</div>
            <div className="text-gray-400 text-xs font-mono">{tag}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return root ? createPortal(panel, root) : panel;
}
