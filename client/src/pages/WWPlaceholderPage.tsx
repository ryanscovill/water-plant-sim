import { Construction } from 'lucide-react';

export function WWPlaceholderPage({ stage }: { stage: string }) {
  return (
    <>
      <h2 className="text-sm font-bold text-gray-300 tracking-widest mb-6">{stage.toUpperCase()}</h2>
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Construction size={48} className="mb-4 text-gray-600" />
        <p className="text-lg font-semibold text-gray-400 mb-2">Coming Soon</p>
        <p className="text-sm">Wastewater treatment simulation is under development.</p>
      </div>
    </>
  );
}
