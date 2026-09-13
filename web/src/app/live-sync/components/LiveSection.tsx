'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface LiveSectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

// A titled block used on the single-page views. Sections are stacked and the sidebar
// scrolls to their id, so there are no per-tab pages to switch between.
export default function LiveSection({ id, title, icon: Icon, children }: LiveSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border-base)]">
        <Icon className="w-4 h-4 text-emerald-500" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
