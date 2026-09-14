'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AppShell } from '@/components/AppShell';
import { CompanionCard, type CompanionSummary } from '@/components/CompanionCard';
import { Card, EmptyState, Button } from '@/components/ui';

export default function FavoritesPage() {
  const [favs, setFavs] = useState<{ companion: CompanionSummary }[] | null>(null);

  useEffect(() => {
    api<{ companion: CompanionSummary }[]>('/favorites').then(setFavs).catch(() => setFavs([]));
  }, []);

  return (
    <AppShell title="Favorites">
      {favs === null ? (
        <Card className="p-6 text-sand-600">Loading…</Card>
      ) : favs.length === 0 ? (
        <Card>
          <EmptyState
            icon="♡"
            title="No favorites yet"
            hint="Tap the heart on any companion to save them here."
            action={<Link href="/explore"><Button variant="secondary">Explore companions</Button></Link>}
          />
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {favs.map((f, i) => <CompanionCard key={f.companion.id} companion={f.companion} index={i} />)}
        </div>
      )}
    </AppShell>
  );
}
