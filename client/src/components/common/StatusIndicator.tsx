interface StatusIndicatorProps {
  running: boolean;
  fault: boolean;
  label: string;
  size?: 'sm' | 'md';
}

export function StatusIndicator({ running, fault, label, size = 'md' }: StatusIndicatorProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  const color = fault ? 'bg-red-500 animate-flash'
    : running ? 'bg-green-400'
    : 'bg-gray-500';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`rounded-full ${dotSize} ${color} inline-block`} />
      <span className="text-xs text-gray-300">{label}</span>
    </div>
  );
}
