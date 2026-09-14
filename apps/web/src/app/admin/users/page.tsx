'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Badge, Button, Input, Spinner } from '@/components/ui';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
  customerProfile?: { displayName: string } | null;
  companionProfile?: { displayName: string; verificationStatus: string } | null;
  riskScore?: { level: 'LOW' | 'MEDIUM' | 'HIGH'; score: number } | null;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  function load(query = '') {
    setUsers(null);
    api<AdminUser[]>(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`).then(setUsers).catch(() => setUsers([]));
  }
  useEffect(() => { if (user?.role === 'ADMIN') load(); }, [user]);

  if (user?.role !== 'ADMIN') return <p className="p-8">Admins only.</p>;

  async function act(id: string, action: 'suspend' | 'ban' | 'restore' | 'warn') {
    const reason = prompt(`Reason for ${action}?`) ?? `Admin ${action}`;
    await api(`/admin/users/${id}/${action}`, { method: 'POST', body: { reason } });
    load(q);
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="font-display text-3xl text-teal-900 mb-4">Users</h1>
      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); load(q); }}
      >
        <Input placeholder="Search by name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <Button type="submit">Search</Button>
      </form>
      <Card className="p-2">
        {!users ? (
          <div className="p-5 text-sand-600 flex items-center gap-2"><Spinner /> Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-sand-600">
                <th className="py-2 px-3">User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-sand-100">
                  <td className="py-3 px-3">
                    <div className="font-semibold">{u.companionProfile?.displayName ?? u.customerProfile?.displayName ?? '—'}</div>
                    <div className="text-xs text-sand-600">{u.email}</div>
                  </td>
                  <td>{u.role}</td>
                  <td><Badge tone={u.status === 'ACTIVE' ? 'success' : u.status === 'BANNED' ? 'danger' : 'warning'}>{u.status}</Badge></td>
                  <td>{u.riskScore ? <Badge tone={u.riskScore.level === 'HIGH' ? 'danger' : u.riskScore.level === 'MEDIUM' ? 'warning' : 'success'}>{u.riskScore.level} {u.riskScore.score}</Badge> : '—'}</td>
                  <td>
                    <div className="flex gap-1.5 flex-wrap">
                      {u.status === 'ACTIVE' ? (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => act(u.id, 'warn')}>Warn</Button>
                          <Button size="sm" variant="danger" className="bg-white !text-danger border border-red-200" onClick={() => act(u.id, 'suspend')}>Suspend</Button>
                          <Button size="sm" variant="danger" onClick={() => act(u.id, 'ban')}>Ban</Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => act(u.id, 'restore')}>Restore</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
