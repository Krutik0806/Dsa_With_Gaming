"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// ─── Demo seed script — populates MongoDB with realistic demo data ─────────────
require("dotenv/config");
const db_1 = require("../db");
const User_1 = require("../models/User");
const Match_1 = require("../models/Match");
const Progress_1 = require("../models/Progress");
const Transaction_1 = require("../models/Transaction");
const auth_1 = require("../lib/auth");
const lessons_1 = require("../../../modules/data/lessons");
const problems_1 = require("../../../modules/data/problems");
async function seed() {
    await (0, db_1.connectDB)();
    console.log("🌱 Seeding demo data...");
    // Clean slate - drop collections or obsolete indexes
    try {
        await Progress_1.Progress.collection.dropIndexes();
    }
    catch { }
    await Promise.all([User_1.User.deleteMany({}), Match_1.Match.deleteMany({}), Progress_1.Progress.deleteMany({}), Transaction_1.Transaction.deleteMany({})]);
    // ── Demo user ──────────────────────────────────────────────────────────────
    const demo = await User_1.User.create({
        username: "demo",
        passwordHash: await (0, auth_1.hashPassword)("demo1234"),
        xp: 3200,
        rating: 1250,
        wins: 18,
        losses: 9,
        draws: 3,
        quizWins: 10,
        codeWins: 8,
        coins: 480,
        streakCount: 7,
        lastActiveDay: new Date().toISOString().split("T")[0],
    });
    console.log("✅ Demo user created:", demo.username);
    // ── Bot users for leaderboard ──────────────────────────────────────────────
    const botNames = ["Alicia_AI", "ByteBot", "CodeNinja_99", "Debugger_Dan", "EliteAlgo"];
    const botRatings = [1420, 1380, 1310, 1180, 1090];
    for (let i = 0; i < botNames.length; i++) {
        await User_1.User.create({
            username: botNames[i],
            passwordHash: await (0, auth_1.hashPassword)("bot" + i),
            rating: botRatings[i],
            xp: botRatings[i] * 2,
            wins: Math.round(botRatings[i] * 0.06),
            losses: Math.round(botRatings[i] * 0.04),
            draws: Math.round(3 + i),
        });
    }
    console.log("✅ Bot users created");
    // ── Demo match history ─────────────────────────────────────────────────────
    const opponents = ["ByteBot", "Alicia_AI", "QuizMaster", "AlgoGuru", "CodeNinja_99"];
    const results = ["WIN", "WIN", "LOSS", "WIN", "DRAW", "WIN", "WIN", "LOSS", "WIN", "WIN"];
    const types = ["QUIZ", "CODING", "QUIZ", "CODING", "QUIZ", "CODING", "QUIZ", "CODING", "QUIZ", "CODING"];
    for (let i = 0; i < results.length; i++) {
        const daysAgo = results.length - i;
        const createdAt = new Date(Date.now() - daysAgo * 86400000);
        await Match_1.Match.create({
            userId: demo._id,
            type: types[i],
            result: results[i],
            opponentName: opponents[i % opponents.length],
            opponentRating: 1100 + Math.round(Math.random() * 300),
            ratingChange: results[i] === "WIN" ? 14 : results[i] === "LOSS" ? -10 : 0,
            xpEarned: results[i] === "WIN" ? 125 : 60,
            score: results[i] === "WIN" ? 7 : 4,
            opponentScore: results[i] === "WIN" ? 3 : 6,
            problemTitle: types[i] === "CODING" ? "Two Sum" : null,
            durationSec: 180 + Math.round(Math.random() * 300),
            details: JSON.stringify({ human: false }),
            createdAt,
            updatedAt: createdAt,
        });
    }
    console.log("✅ Match history seeded");
    // ── Progress: a few completed lessons + problems ───────────────────────────
    const lessonsToMark = lessons_1.LESSONS.slice(0, 4).map((l) => l.slug);
    const problemsToMark = problems_1.PROBLEMS.filter((p) => p.difficulty === "EASY").slice(0, 5).map((p) => p.slug);
    for (const slug of lessonsToMark) {
        await Progress_1.Progress.create({ userId: demo._id, kind: "LESSON", refId: slug, xpAwarded: 75 });
    }
    for (const slug of problemsToMark) {
        await Progress_1.Progress.create({ userId: demo._id, kind: "PROBLEM", refId: slug, xpAwarded: 100 });
    }
    console.log("✅ Progress seeded");
    // ── Coin transactions ──────────────────────────────────────────────────────
    const txRows = [
        { amount: 40, source: "MATCH_WIN", description: "coding win vs ByteBot" },
        { amount: 40, source: "MATCH_WIN", description: "quiz win vs AlgoGuru" },
        { amount: 15, source: "DAILY_CHECKIN", description: "daily check-in · day 5" },
        { amount: -150, source: "SHOP_PURCHASE", description: "streak freeze" },
        { amount: 50, source: "DAILY_CHALLENGE", description: "daily challenge solved: two-sum" },
    ];
    for (const tx of txRows) {
        await Transaction_1.Transaction.create({ userId: demo._id, ...tx });
    }
    console.log("✅ Coin transactions seeded");
    console.log("\n🎉 Seeding complete!");
    console.log("   Login with:  username=demo  password=demo1234");
    process.exit(0);
}
seed().catch((e) => { console.error(e); process.exit(1); });
//# sourceMappingURL=seed.js.map