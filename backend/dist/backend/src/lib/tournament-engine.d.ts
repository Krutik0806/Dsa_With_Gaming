import type { BracketRound, EntryStatus, TournamentOpponent } from "../../../modules/types";
export interface BracketData {
    rounds: BracketRound[];
    playerName: string;
    players: Record<string, TournamentOpponent>;
}
export declare function generateBracket(userRating: number, username: string): BracketData;
export declare function nextOpponentFor(bracket: BracketData, round: number): TournamentOpponent | null;
export interface AdvanceResult {
    bracket: BracketData;
    advanced: boolean;
    status: EntryStatus;
    round: number;
    placement: number | null;
    xpBonus: number;
    eliminatedIn: string | null;
}
/**
 * Record the user's round result and resolve the rest of the bracket.
 * Knockout rules: a win advances, anything else (loss/draw) eliminates —
 * ties in cups go to the opponent on seed order.
 */
export declare function advanceBracket(data: BracketData, round: number, result: "WIN" | "LOSS" | "DRAW", userScore: number, opponentScore: number, gameType: "CODING" | "QUIZ", prizeXp: number): AdvanceResult;
export declare function tournamentContextFor(slug: string): {
    name: string;
    gameType: "CODING" | "QUIZ";
    prizeXp: number;
} | null;
export declare function parseBracket(json: string, fallbackPlayer: string): BracketData;
//# sourceMappingURL=tournament-engine.d.ts.map