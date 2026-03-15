import { BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-primary", className)}>
      <BookOpenCheck className="h-8 w-8" />
      <h1 className="text-2xl font-bold">NEU LibLog</h1>
    </div>
  );
}
