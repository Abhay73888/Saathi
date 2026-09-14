'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Card, Spinner, Badge, Button } from '@/components/ui';

interface ReportRow {
  id: string;
  reason: string;
  details: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: string;
  reporter: { customerProfile?: { displayName: string } };
  reportedUser?: { customerProfile?: { displayName: string }; companionProfile?: { displayName: string } } | null;
}
interface FlagRow {
  id: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: string[];
  message: { id: string; body: string; sender: { customerProfile?: { displayName: string }; companionProfile?: { displayName: string } } };
}

export default function AdminQueuePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [flags, setFlags] = useState<FlagRow[] | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    api<ReportRow[]>('/admin/reports').then(setReports).catch(() => setReports([]));
    api<FlagRow[]>('/admin/messages/flagged').then(setFlags).catch(() => setFlags([]));
  }, [user]);

  if (user?.role !== 'ADMIN') return <p className="p-8">Admins only.</p>;

  const riskTone = (l: string) => (l === 'HIGH' ? 'danger' : l === 'MEDIUM' ? 'warning' : 'success') as 'danger' | 'warning' | 'success';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="font-display text-3xl text-teal-900 mb-6">Moderation queue</h1>

      <Card className="p-5 mb-6">
        <h2 className="font-bold mb-4">🚨 Reports</h2>
        {!reports ? <Spinner /> : reports.length === 0 ? (
          <p className="text-sm text-sand-600">No open reports. 🎉</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="border border-sand-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge tone={riskTone(r.riskLevel)}>{r.riskLevel} risk</Badge>
                  <span className="font-bold text-sm">{r.reason.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-sand-600 ml-auto">
                    {r.reportedUser?.companionProfile?.displayName ?? r.reportedUser?.customerProfile?.displayName ?? 'user'}
                  </span>
                </div>
                <p className="text-sm text-sand-600 mb-2">{r.details}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="danger" className="bg-white !text-danger border border-red-200"
                    onClick={() => api(`/admin/reports/${r.id}/decide`, { method: 'POST', body: { action: 'SUSPEND', note: 'Admin review' } }).then(() => setReports((p) => p?.filter((x) => x.id !== r.id) ?? null))}>
                    Suspend user
                  </Button>
                  <Button size="sm" variant="ghost"
                    onClick={() => api(`/admin/reports/${r.id}/decide`, { method: 'POST', body: { action: 'DISMISS' } }).then(() => setReports((p) => p?.filter((x) => x.id !== r.id) ?? null))}>
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-bold mb-4">💬 Flagged messages</h2>
        {!flags ? <Spinner /> : flags.length === 0 ? (
          <p className="text-sm text-sand-600">No flagged messages.</p>
        ) : (
          <div className="space-y-3">
            {flags.map((f) => (
              <div key={f.id} className="border border-sand-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge tone={riskTone(f.riskLevel)}>{f.riskLevel}</Badge>
                  <span className="text-xs text-sand-600">signals: {f.signals.join(', ')}</span>
                </div>
                <p className="text-sm mb-2 italic text-sand-600">“{f.message.body}”</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary"
                    onClick={() => api(`/admin/messages/${f.message.id}/moderate`, { method: 'POST', body: { resolution: 'REMOVED' } }).catch(() => {})}>
                    Remove message
                  </Button>
                  <Button size="sm" variant="ghost"
                    onClick={() => setFlags((p) => p?.filter((x) => x.id !== f.id) ?? null)}>
                    Mark resolved
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
