/**
 * Compatibility matching — V1 heuristic strategy.
 *
 * The interface is intentionally swappable: callers depend on
 * `RecommendationStrategy`, so V2 can ship an ML/pgvector strategy without
 * touching route code. Protected characteristics (gender, religion, caste,
 * age beyond the 18+ gate) are NEVER inputs.
 */

export interface CompanionMatchData {
  companionId: string;
  interests: string[];
  languages: string[];
  experienceSlugs: string[];
  city?: string | null;
  /** hourly/session rate in paise for the relevant experience */
  ratePaise: bigint | number;
  ratingAvg: number; // 0..5
  responseRate: number; // 0..1
  completionRate: number; // 0..1
  isVerified: boolean;
  /** true when the companion has a free slot covering the requested window */
  availableForWindow: boolean;
  distanceKm?: number | null;
}

export interface MatchPreferences {
  interests?: string[];
  languages?: string[];
  experienceSlugs?: string[];
  city?: string | null;
  maxDistanceKm?: number | null;
  budgetPaise?: bigint | number | null;
  needsAvailability?: boolean;
}

export interface MatchWeights {
  interests: number;
  languages: number;
  activities: number;
  location: number;
  availability: number;
  budget: number;
  quality: number;
  trust: number;
}

/** Tunable from platform settings; defaults sum to 1. */
export const DEFAULT_WEIGHTS: MatchWeights = {
  interests: 0.2,
  languages: 0.12,
  activities: 0.16,
  location: 0.12,
  availability: 0.15,
  budget: 0.08,
  quality: 0.12,
  trust: 0.05,
};

export interface MatchResult {
  companionId: string;
  /** 0..100 compatibility score, rounded */
  score: number;
  /** per-signal breakdown for transparency/debugging */
  signals: Record<keyof MatchWeights, number>;
}

export interface RecommendationStrategy {
  score(companion: CompanionMatchData, prefs: MatchPreferences): MatchResult;
  rank(companions: CompanionMatchData[], prefs: MatchPreferences): MatchResult[];
}

export const SYNONYM_CLUSTERS: Record<string, string[]> = {
  coffee: ['cafe', 'coffee', 'brews', 'espresso', 'cappuccino', 'tea', 'chai'],
  movies: ['movie', 'movies', 'cinema', 'film', 'films', 'theatre', 'imax'],
  concerts: ['concert', 'concerts', 'music', 'gig', 'gigs', 'fest', 'festival', 'band'],
  fitness: ['gym', 'fitness', 'workout', 'running', 'jogging', 'badminton', 'sports'],
  gaming: ['game', 'gaming', 'games', 'boardgame', 'boardgames', 'arcade', 'playstation'],
  study: ['study', 'studying', 'reading', 'books', 'coworking', 'work', 'focus'],
  food: ['food', 'dining', 'dinner', 'lunch', 'brunch', 'eating', 'streetfood', 'restaurant'],
  walking: ['walk', 'walking', 'walks', 'heritage', 'explore', 'exploring', 'photowalk'],
};

export function normalizeToken(token: string): string {
  const t = token.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(SYNONYM_CLUSTERS)) {
    if (synonyms.some((s) => t.includes(s) || s.includes(t))) {
      return canonical;
    }
  }
  return t;
}

function jaccard(a: string[], b: string[]): number {
  const sa = new Set(a.map(normalizeToken));
  const sb = new Set(b.map(normalizeToken));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const v of sa) if (sb.has(v)) inter++;
  return inter / (sa.size + sb.size - inter);
}

function overlap(a: string[], b: string[]): number {
  const sb = new Set(b.map(normalizeToken));
  const hits = a.map(normalizeToken).filter((v) => sb.has(v)).length;
  return a.length === 0 ? 0 : Math.min(1, hits / a.length);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export class HeuristicRecommendationStrategy implements RecommendationStrategy {
  constructor(private readonly weights: MatchWeights = DEFAULT_WEIGHTS) {}

  score(c: CompanionMatchData, prefs: MatchPreferences): MatchResult {
    const w = this.weights;

    const interests = prefs.interests?.length ? jaccard(prefs.interests, c.interests) : 0;
    const languages = prefs.languages?.length ? overlap(prefs.languages, c.languages) : 0;
    const activities = prefs.experienceSlugs?.length
      ? overlap(prefs.experienceSlugs, c.experienceSlugs)
      : 0;

    let location = 0;
    if (prefs.city && c.city && prefs.city.toLowerCase() === c.city.toLowerCase()) location = 1;
    else if (prefs.maxDistanceKm != null && c.distanceKm != null) {
      // linear decay: 0km = 1, maxDistance = 0
      location = clamp01(1 - c.distanceKm / prefs.maxDistanceKm);
    }

    const availability = prefs.needsAvailability ? (c.availableForWindow ? 1 : 0) : 1;

    let budget = 1;
    if (prefs.budgetPaise != null) {
      const b = Number(prefs.budgetPaise);
      const rate = Number(c.ratePaise);
      budget = rate <= b ? 1 : clamp01(Math.max(0, 1 - (rate - b) / b));
    }

    const quality = clamp01(
      (c.ratingAvg / 5) * 0.6 + c.responseRate * 0.25 + c.completionRate * 0.15,
    );
    const trust = c.isVerified ? 1 : 0.4;

    const signals: Record<keyof MatchWeights, number> = {
      interests,
      languages,
      activities,
      location,
      availability,
      budget,
      quality,
      trust,
    };

    const raw =
      w.interests * interests +
      w.languages * languages +
      w.activities * activities +
      w.location * location +
      w.availability * availability +
      w.budget * budget +
      w.quality * quality +
      w.trust * trust;

    return { companionId: c.companionId, score: Math.round(raw * 100), signals };
  }

  rank(companions: CompanionMatchData[], prefs: MatchPreferences): MatchResult[] {
    return companions
      .map((c) => this.score(c, prefs))
      .sort((a, b) => b.score - a.score);
  }
}

export const recommendationEngine: RecommendationStrategy =
  new HeuristicRecommendationStrategy();
