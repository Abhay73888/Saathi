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
    ratingAvg: number;
    responseRate: number;
    completionRate: number;
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
export declare const DEFAULT_WEIGHTS: MatchWeights;
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
export declare const SYNONYM_CLUSTERS: Record<string, string[]>;
export declare function normalizeToken(token: string): string;
export declare class HeuristicRecommendationStrategy implements RecommendationStrategy {
    private readonly weights;
    constructor(weights?: MatchWeights);
    score(c: CompanionMatchData, prefs: MatchPreferences): MatchResult;
    rank(companions: CompanionMatchData[], prefs: MatchPreferences): MatchResult[];
}
export declare const recommendationEngine: RecommendationStrategy;
