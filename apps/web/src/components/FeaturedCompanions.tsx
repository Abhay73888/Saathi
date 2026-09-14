'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { CompanionCard, type CompanionSummary } from './CompanionCard';

export function FeaturedCompanions({ fallback }: { fallback: ReactNode }) {
  const [companions, setCompanions] = useState<CompanionSummary[] | null>(null);

  useEffect(() => {
    api<CompanionSummary[]>('/companions?sort=rating&pageSize=6')
      .then(setCompanions)
      .catch(() => setCompanions([]));
  }, []);

  if (!companions) return <>{fallback}</>;
  if (companions.length === 0)
    return (
      <div className="col-span-full text-center py-10 text-sand-600">
        No live companions yet — seed data appears after the API is seeded.
      </div>
    );
  return <>{companions.slice(0, 3).map((c, i) => <CompanionCard key={c.id} companion={c} index={i} />)}</>;
}
