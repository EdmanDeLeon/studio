import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className, large = false }: { className?: string; large?: boolean }) {
  return (
    <div className={cn("flex items-center", large ? "gap-4" : "gap-3", className)}>
      <Image 
        src="https://neu.edu.ph/main/img/neu.png"
        alt="New Era University Logo"
        width={large ? 56 : 32}
        height={large ? 56 : 32}
        className={cn(large ? "h-14 w-14" : "h-8 w-8")}
        priority
      />
      <div>
        <h1 className={cn("font-bold text-primary", large ? "text-3xl" : "text-lg", 'leading-tight')}>NEU Library</h1>
        <p className={cn("text-muted-foreground", large ? "text-sm" : "text-xs")}>Digital Visitor Log</p>
      </div>
    </div>
  );
}
