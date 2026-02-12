import { cn } from '@/lib/cn';

export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <div className={cn('h-2 w-full rounded-full bg-gray-100 border border-gray-200 overflow-hidden', className)}>
      <div className="h-full bg-gray-900" style={{ width: `${v}%` }} />
    </div>
  );
}
