'use client';

import Link from 'next/link';
import { Avatar, Badge, HeartIcon, Stars } from './ui';
import { formatINR } from '@/lib/api';

export interface CompanionSummary {
  id: string;
  displayName: string;
  tagline?: string;
  bio?: string;
  city: string;
  area?: string | null;
  interests: string[];
  languages?: string[];
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
  fromRatePaise: number | null;
  compatibility?: number | null;
  avatarKey?: string | null;
}

export function CompanionCard({
  companion,
  index = 0,
  favorited,
  onToggleFavorite,
}: {
  companion: CompanionSummary;
  index?: number;
  favorited?: boolean;
  onToggleFavorite?: (id: string) => void;
}) {
  return (
    <article className="bg-white rounded-2xl shadow-card border border-sand-200/70 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-pop group flex flex-col justify-between">
      <div>
        <div className="relative aspect-[4/3] bg-gradient-to-br from-teal-700 via-teal-800 to-teal-950 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20" />
          <div className="transition-transform duration-300 group-hover:scale-105 z-10">
            <Avatar name={companion.displayName} size="lg" index={index} />
          </div>
          {companion.compatibility != null && (
            <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-black text-teal-800 shadow-sm z-10 flex items-center gap-1">
              ✨ {companion.compatibility}% match
            </span>
          )}
          {companion.verified && (
            <span className="absolute bottom-3 left-3 bg-teal-900/90 backdrop-blur-sm text-teal-100 border border-teal-500/30 rounded-full px-3 py-1 text-xs font-bold z-10 flex items-center gap-1.5">
              🛡️ ID &amp; Background Verified
            </span>
          )}
          {onToggleFavorite && (
            <button
              aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
              onClick={() => onToggleFavorite(companion.id)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform z-10"
            >
              <HeartIcon filled={favorited} className="w-5 h-5 text-rose-500" />
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Link href={`/companion/${companion.id}`} className="font-display font-bold text-xl text-sand-900 hover:text-teal-700 transition-colors">
              {companion.displayName}
            </Link>
            <Badge tone="verified" className="text-xs py-1">Platonic Only</Badge>
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-sm font-semibold text-sand-600 flex-wrap">
            <Stars value={companion.ratingAvg} />
            <span>({companion.ratingCount} reviews)</span>
            <span>·</span>
            <span className="flex items-center gap-0.5">📍 {companion.city}{companion.area ? `, ${companion.area}` : ''}</span>
          </div>

          <p className="text-base text-sand-700 mt-3 line-clamp-2 min-h-[44px] leading-relaxed">
            {companion.tagline ?? companion.bio ?? 'Ready for meaningful social hangouts, events and city walks.'}
          </p>

          <div className="flex gap-1.5 flex-wrap mt-3.5">
            {companion.interests.slice(0, 3).map((i) => (
              <span key={i} className="bg-sand-100 text-sand-800 rounded-lg px-2.5 py-1 text-xs font-semibold capitalize border border-sand-200/50">
                {i}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 pt-0">
        <div className="flex items-center justify-between pt-3 border-t border-sand-200">
          <div>
            <span className="text-xs uppercase tracking-wider text-sand-500 font-semibold block">Rate</span>
            <div className="font-extrabold text-teal-900 text-lg">
              {companion.fromRatePaise ? `${formatINR(companion.fromRatePaise)}/hr` : 'Custom'}
            </div>
          </div>
          <Link href={`/companion/${companion.id}`}>
            <span className="h-10 px-4 inline-flex items-center rounded-lg bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 shadow-sm transition active:scale-95">
              Book Companion →
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function CompanionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-sand-200/60 overflow-hidden">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4">
        <div className="h-4 w-2/3 skeleton rounded mb-3" />
        <div className="h-3 w-1/2 skeleton rounded mb-4" />
        <div className="h-3 w-full skeleton rounded mb-2" />
        <div className="h-3 w-5/6 skeleton rounded" />
      </div>
    </div>
  );
}
