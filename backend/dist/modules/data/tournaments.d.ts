import type { Difficulty, TournamentSummary } from "../types";
export declare const TOURNAMENTS: TournamentSummary[];
export declare function getTournament(slug: string): TournamentSummary | undefined;
export declare function isPlayable(t: TournamentSummary): boolean;
/** Round names for an 8-player knockout. */
export declare function roundName(round: number, roundsTotal: number): string;
/** Difficulty ramps one tier per round: quarters easy → semis medium → final hard. */
export declare function difficultyForRound(base: Difficulty, round: number): Difficulty;
/** XP awarded for winning each round (champion also banks the prize pool). */
export declare const ROUND_XP: number[];
/** Placement label for an eliminated (or champion) entry. */
export declare function placementLabel(placement: number | null): string;
//# sourceMappingURL=tournaments.d.ts.map