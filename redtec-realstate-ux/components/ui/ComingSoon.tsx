'use client';

import type { LucideIcon } from 'lucide-react';

interface ComingSoonProps {
  icon: LucideIcon;
  description?: string;
}

export function ComingSoon({ icon: Icon, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
        <Icon size={24} className="text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-base-content">Próximamente</p>
        {description && (
          <p className="text-xs text-base-content/50 mt-1 max-w-xs">{description}</p>
        )}
      </div>
    </div>
  );
}
