'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { AppShell } from '@/components/AppShell';
import { Button, Card, Input } from '@/components/ui';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.customerProfile?.displayName ?? '');
      setCity(user.customerProfile?.city ?? '');
    }
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await api('/profile', { method: 'PATCH', body: { displayName, city } });
    await refresh();
    setSaved(true);
  }

  return (
    <AppShell title="Profile">
      <Card className="p-6 max-w-lg">
        <form onSubmit={save} className="space-y-4">
          <Input label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
          <div className="text-sm text-sand-600 border-t border-sand-200 pt-4">
            <p><strong>Email:</strong> {user?.email} {user?.phone ? `· <strong>Phone:</strong> ${user.phone}` : ''}</p>
            <p className="mt-1">Role: {user?.role}{user?.companionProfile ? ` · ${user.companionProfile.verificationStatus.toLowerCase()}` : ''}</p>
          </div>
          {saved && <p className="text-sm text-success font-semibold">✓ Profile updated</p>}
          <Button type="submit">Save profile</Button>
        </form>
      </Card>
    </AppShell>
  );
}
