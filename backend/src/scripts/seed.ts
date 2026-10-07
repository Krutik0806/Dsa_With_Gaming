// ─── Demo seed script — populates MongoDB with realistic demo data ─────────────
import "dotenv/config";
import { connectDB } from "../db";
import { User } from "../models/User";
import { Match } from "../models/Match";
import { Progress } from "../models/Progress";
import { Transaction } from "../models/Transaction";
import { hashPassword } from "../lib/auth";
import { LESSONS } from "../../../modules/data/lessons";
import { PROBLEMS } from "../../../modules/data/problems";

async function seed() {
  await connectDB();
  console.log("🌱 Seeding demo data...");

  // Clean slate - drop collections or obsolete indexes
  try { await Progress.collection.dropIndexes(); } catch {}
  await Promise.all([User.deleteMany({}), Match.deleteMany({}), Progress.deleteMany({}), Transaction.deleteMany({})]);

  // ── Demo user ──────────────────────────────────────────────────────────────
  const demo = await User.create({
    username: "demo",
    passwordHash: await hashPassword("demo1234"),
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
    await User.create({
      username: botNames[i],
      passwordHash: await hashPassword("bot" + i),
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
  const results: ("WIN" | "LOSS" | "DRAW")[] = ["WIN", "WIN", "LOSS", "WIN", "DRAW", "WIN", "WIN", "LOSS", "WIN", "WIN"];
  const types: ("QUIZ" | "CODING")[] = ["QUIZ", "CODING", "QUIZ", "CODING", "QUIZ", "CODING", "QUIZ", "CODING", "QUIZ", "CODING"];

  for (let i = 0; i < results.length; i++) {
    const daysAgo = results.length - i;
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    await Match.create({
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
  const lessonsToMark = LESSONS.slice(0, 4).map((l) => l.slug);
  const problemsToMark = PROBLEMS.filter((p) => p.difficulty === "EASY").slice(0, 5).map((p) => p.slug);

  for (const slug of lessonsToMark) {
    await Progress.create({ userId: demo._id, kind: "LESSON", refId: slug, xpAwarded: 75 });
  }
  for (const slug of problemsToMark) {
    await Progress.create({ userId: demo._id, kind: "PROBLEM", refId: slug, xpAwarded: 100 });
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
    await Transaction.create({ userId: demo._id, ...tx });
  }
  console.log("✅ Coin transactions seeded");

  console.log("\n🎉 Seeding complete!");
  console.log("   Login with:  username=demo  password=demo1234");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
