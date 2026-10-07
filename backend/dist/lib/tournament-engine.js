"use strict";
// ─── Tournament bracket engine (server-only) ─────────────────────────────────
// Generates 8-player knockout brackets and advances them from match results.
// The other seven slots are seeded from the arena's active player pool, so a
// cup is always one click away (in production these are real registrants).
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBracket = generateBracket;
exports.nextOpponentFor = nextOpponentFor;
exports.advanceBracket = advanceBracket;
exports.tournamentContextFor = tournamentContextFor;
exports.parseBracket = parseBracket;
const bots_1 = require("./bots");
const tournaments_1 = require("../../../modules/data/tournaments");
const PAIRINGS = [
    [0, 7],
    [3, 4],
    [1, 6],
    [2, 5],
];
function generateBracket(userRating, username) {
    // Seven opponents closest to the player's rating, shuffled.
    const pool = [...bots_1.BOTS].sort((a, b) => Math.abs(a.rating - userRating) - Math.abs(b.rating - userRating)).slice(0, 9);
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const opponents = pool.slice(0, 7);
    const userSeed = Math.floor(Math.random() * 8);
    const seeds = [];
    let botIdx = 0;
    for (let s = 0; s < 8; s++) {
        if (s === userSeed)
            seeds.push({ name: username, rating: userRating, skill: 1, tagline: "you", color: "#34d399", isUser: true });
        else {
            const b = opponents[botIdx++];
            const jitter = Math.round((Math.random() - 0.5) * 60);
            seeds.push({ ...b, rating: b.rating + jitter });
        }
    }
    const players = {};
    for (const p of seeds)
        players[p.name] = { name: p.name, rating: p.rating, skill: p.skill, tagline: p.tagline, color: p.color };
    const qf = PAIRINGS.map(([a, b]) => ({
        a: seeds[a].name,
        b: seeds[b].name,
        scoreA: null,
        scoreB: null,
        winner: null,
    }));
    const sf = [
        { a: "", b: "", scoreA: null, scoreB: null, winner: null },
        { a: "", b: "", scoreA: null, scoreB: null, winner: null },
    ];
    const f = [{ a: "", b: "", scoreA: null, scoreB: null, winner: null }];
    return {
        rounds: [
            { name: "Quarterfinal", matches: qf },
            { name: "Semifinal", matches: sf },
            { name: "Final", matches: f },
        ],
        playerName: username,
        players,
    };
}
function nextOpponentFor(bracket, round) {
    const r = bracket.rounds[round - 1];
    if (!r)
        return null;
    for (const m of r.matches) {
        if (m.a === bracket.playerName)
            return bracket.players[m.b] ?? null;
        if (m.b === bracket.playerName)
            return bracket.players[m.a] ?? null;
    }
    return null;
}
function simulateScore(winnerIsA, gameType) {
    if (gameType === "QUIZ") {
        const hi = 380 + Math.floor(Math.random() * 120);
        const lo = Math.floor(hi * (0.6 + Math.random() * 0.3));
        return winnerIsA ? { scoreA: hi, scoreB: lo } : { scoreA: lo, scoreB: hi };
    }
    const hi = 5 + Math.floor(Math.random() * 3);
    const lo = Math.floor(hi * (0.3 + Math.random() * 0.4));
    return winnerIsA ? { scoreA: hi, scoreB: lo } : { scoreA: lo, scoreB: hi };
}
/**
 * Record the user's round result and resolve the rest of the bracket.
 * Knockout rules: a win advances, anything else (loss/draw) eliminates —
 * ties in cups go to the opponent on seed order.
 */
function advanceBracket(data, round, result, userScore, opponentScore, gameType, prizeXp) {
    const bracket = JSON.parse(JSON.stringify(data));
    const roundsTotal = bracket.rounds.length;
    const roundIdx = Math.min(round, roundsTotal) - 1;
    const eliminatedIn = (0, tournaments_1.roundName)(round, roundsTotal);
    const userMatch = bracket.rounds[roundIdx].matches.find((m) => m.a === bracket.playerName || m.b === bracket.playerName);
    const won = result === "WIN";
    if (userMatch) {
        const userIsA = userMatch.a === bracket.playerName;
        userMatch.scoreA = userIsA ? userScore : opponentScore;
        userMatch.scoreB = userIsA ? opponentScore : userScore;
        userMatch.winner = won ? bracket.playerName : userIsA ? userMatch.b : userMatch.a;
    }
    // Resolve the rest of this round (rating-weighted coin flips).
    for (const m of bracket.rounds[roundIdx].matches) {
        if (m.winner)
            continue;
        if (m.a === bracket.playerName || m.b === bracket.playerName)
            continue;
        const ra = bracket.players[m.a]?.rating ?? 1200;
        const rb = bracket.players[m.b]?.rating ?? 1200;
        const pA = 1 / (1 + Math.pow(10, (rb - ra) / 400));
        const aWins = Math.random() < pA;
        const { scoreA, scoreB } = simulateScore(aWins, gameType);
        m.scoreA = scoreA;
        m.scoreB = scoreB;
        m.winner = aWins ? m.a : m.b;
    }
    if (!won) {
        return {
            bracket,
            advanced: false,
            status: "ELIMINATED",
            round,
            placement: round === 1 ? 5 : round === 2 ? 3 : 2,
            xpBonus: 0,
            eliminatedIn,
        };
    }
    if (round >= roundsTotal) {
        return {
            bracket,
            advanced: true,
            status: "CHAMPION",
            round,
            placement: 1,
            xpBonus: tournaments_1.ROUND_XP[roundIdx] + prizeXp,
            eliminatedIn: null,
        };
    }
    // Populate the next round from winners.
    const winners = bracket.rounds[roundIdx].matches.map((m) => m.winner ?? m.a);
    const next = bracket.rounds[roundIdx + 1];
    for (let i = 0; i < next.matches.length; i++) {
        next.matches[i].a = winners[i * 2] ?? "";
        next.matches[i].b = winners[i * 2 + 1] ?? "";
        next.matches[i].scoreA = null;
        next.matches[i].scoreB = null;
        next.matches[i].winner = null;
    }
    return {
        bracket,
        advanced: true,
        status: "ACTIVE",
        round: round + 1,
        placement: null,
        xpBonus: tournaments_1.ROUND_XP[roundIdx],
        eliminatedIn: null,
    };
}
function tournamentContextFor(slug) {
    const t = (0, tournaments_1.getTournament)(slug);
    if (!t)
        return null;
    return { name: t.name, gameType: t.gameType, prizeXp: t.prizeXp };
}
function parseBracket(json, fallbackPlayer) {
    try {
        const parsed = JSON.parse(json);
        if (parsed && Array.isArray(parsed.rounds)) {
            return { ...parsed, playerName: parsed.playerName || fallbackPlayer, players: parsed.players ?? {} };
        }
    }
    catch {
        /* fallthrough */
    }
    return { rounds: [], playerName: fallbackPlayer, players: {} };
}
//# sourceMappingURL=tournament-engine.js.map