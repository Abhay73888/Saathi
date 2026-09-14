'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CompanionCard, CompanionCardSkeleton, type CompanionSummary } from '@/components/CompanionCard';
import { Button } from '@/components/ui';
import { ACTIVITY_EXPERIENCES, VIBE_TAGS } from '@saath/shared';

const SORTS = [
  { value: 'recommended', label: 'Recommended & Best Match' },
  { value: 'rating', label: 'Highest Rated (4.8+)' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'most_booked', label: 'Most Booked' },
];

const PROMPT_CHIPS = [
  '🎸 Concert & music festival buddy',
  '☕ Specialty coffee & deep conversations',
  '🎬 IMAX movie companion this weekend',
  '🏃 Morning run or badminton pal',
  '🎲 Board games & cafe trivia',
  '💼 Co-working & Pomodoro focus',
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialInterest = searchParams.get('interest') || '';

  const [companions, setCompanions] = useState<CompanionSummary[] | null>(null);
  const [city, setCity] = useState('');
  const [interest, setInterest] = useState(initialInterest);
  const [selectedVibe, setSelectedVibe] = useState('');
  const [sort, setSort] = useState('recommended');
  const [aiPrefs, setAiPrefs] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setCompanions(null);
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (interest) params.set('interest', interest);
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('pageSize', '20');

    const searchTokens: string[] = [];
    if (selectedVibe) searchTokens.push(selectedVibe.toLowerCase());

    if (aiPrefs.trim()) {
      searchTokens.push(
        ...aiPrefs
          .toLowerCase()
          .split(/[^a-z]+/)
          .filter((w) => w.length >= 3),
      );
    }

    if (searchTokens.length > 0) {
      params.set('interests', searchTokens.slice(0, 5).join(','));
    }

    const res = await api<CompanionSummary[]>(`/companions?${params.toString()}`).catch(
      () => [] as CompanionSummary[],
    );
    setCompanions(Array.isArray(res) ? res : []);
    setTotal((Array.isArray(res) ? res : []).length);
  }, [city, interest, selectedVibe, sort, aiPrefs, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest text-teal-700 font-bold">100% Identity Verified &amp; Platonic</span>
        <h1 className="font-display text-3xl md:text-4xl text-teal-950 font-bold mt-1">
          Explore Activity Companions
        </h1>
        <p className="text-sand-600 mt-1">
          Find verified social companions for coffee, concerts, movies, dining, sports, or study sessions in your city.
        </p>
      </div>

      {/* AI preference & search bar */}
      <div className="bg-white rounded-2xl shadow-card border border-sand-200/80 p-5 mb-8">
        <label className="block text-[13.5px] font-bold text-sand-900 mb-2">
          ✨ Describe your ideal hangout or companion:
        </label>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            value={aiPrefs}
            onChange={(e) => setAiPrefs(e.target.value)}
            placeholder="e.g. Someone who loves indie rock, coffee tasting, and speaks English & Hindi"
            className="flex-1 h-12 rounded-xl border border-sand-200 px-4 text-[15px] focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15"
          />
          <Button
            onClick={() => {
              setPage(1);
              void load();
            }}
            className="h-12 px-6 font-bold shadow-sm"
          >
            Find Matches
          </Button>
        </div>

        {/* Quick prompt chips */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-sand-100">
          <span className="text-xs text-sand-500 font-semibold py-1">Quick ideas:</span>
          {PROMPT_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setAiPrefs(chip.replace(/^[^\w]+/, ''));
                setPage(1);
              }}
              className="text-xs bg-sand-100/80 hover:bg-teal-50 hover:text-teal-800 text-sand-700 px-2.5 py-1 rounded-lg border border-sand-200/60 transition"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters Sidebar */}
        <aside className="bg-white rounded-2xl shadow-card border border-sand-200/80 p-5 h-fit lg:sticky lg:top-20 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-sand-900">Filters</h2>
              {(city || interest || selectedVibe || aiPrefs) && (
                <button
                  onClick={() => {
                    setCity('');
                    setInterest('');
                    setSelectedVibe('');
                    setAiPrefs('');
                    setPage(1);
                  }}
                  className="text-xs font-bold text-teal-700 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            <label className="block mb-4">
              <span className="block text-sm font-bold mb-1.5 text-sand-800">City / Location</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru, Delhi, Mumbai"
                className="w-full h-11 rounded-lg border border-sand-200 px-3 text-base focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/15"
              />
            </label>
          </div>

          <div>
            <span className="block text-sm font-bold mb-2 text-sand-800">Activity &amp; Experience</span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  setInterest('');
                  setPage(1);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-between ${
                  !interest ? 'bg-teal-700 text-white' : 'hover:bg-sand-100 text-sand-700'
                }`}
              >
                <span>🌟 All Experiences</span>
              </button>
              {ACTIVITY_EXPERIENCES.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => {
                    setInterest(interest === exp.slug ? '' : exp.slug);
                    setPage(1);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-between ${
                    interest === exp.slug
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'hover:bg-sand-100 text-sand-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{exp.icon}</span>
                    <span>{exp.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-bold mb-2 text-sand-800">Vibe / Personality</span>
            <div className="flex flex-wrap gap-1.5">
              {VIBE_TAGS.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSelectedVibe(selectedVibe === v ? '' : v);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                    selectedVibe === v
                      ? 'bg-sand-900 text-white border-sand-900 shadow-sm'
                      : 'bg-sand-100/70 border-sand-200/60 text-sand-700 hover:border-teal-400'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block">
              <span className="block text-sm font-bold mb-1.5 text-sand-800">Sort Results</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full h-11 rounded-lg border border-sand-200 px-3 text-sm font-semibold bg-white focus:outline-none focus:border-teal-600"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </aside>

        {/* Results Stream */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-sand-700">
              {companions ? `${total} verified companion${total === 1 ? '' : 's'} available` : 'Searching verified companions…'}
            </p>
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200/60">
              ✓ Platonic &amp; Safe Venues Only
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {companions === null ? (
              Array.from({ length: 6 }).map((_, i) => <CompanionCardSkeleton key={i} />)
            ) : companions.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-sand-200 p-12 text-center shadow-card">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-bold text-lg text-sand-900 mb-1">No companions match these criteria</h3>
                <p className="text-sm text-sand-600 max-w-sm mx-auto">
                  Try clearing the city filter or selecting a different activity like Coffee or Movies.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-5 font-bold"
                  onClick={() => {
                    setCity('');
                    setInterest('');
                    setSelectedVibe('');
                    setAiPrefs('');
                  }}
                >
                  Reset All Filters
                </Button>
              </div>
            ) : (
              companions.map((c, i) => <CompanionCard key={c.id} companion={c} index={i} />)
            )}
          </div>

          {total >= 20 && (
            <div className="text-center mt-10">
              <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                Load More Companions
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-4 py-16 text-center text-sand-600">Loading directory...</div>}>
      <ExploreContent />
    </Suspense>
  );
}

