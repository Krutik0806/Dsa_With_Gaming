# 🎮 CodeClash — Gamified DSA Learning & Real-Time Competitive Arena

> A full-stack, production-grade web platform combining interactive Data Structures & Algorithms (DSA) visualizers with a real-time multiplayer 1v1 coding battle arena, ELO rating engine, and hybrid cloud/local multi-language code judge.

---

## 🌟 Executive Summary & Project Overview

CodeClash bridges the gap between theoretical algorithm learning and competitive programming. While platforms like LeetCode and HackerRank offer static problem banks, CodeClash introduces:
1. **Interactive Visualizers**: Step-by-step animated representations of algorithmic operations (Two Pointers, Sliding Window, Trees, Graphs, Sorting, etc.) with Play/Pause, Step Forward/Back, and speed control.
2. **Real-Time 1v1 Arena**: Competitive live coding duels built on low-latency WebSockets with instant synchronization of opponent progress, health bars, and test cases.
3. **Smart Bot Fallback**: Instant matchmaking fallback that spawns simulated AI opponents with human-like coding pacing and randomized solution strategies when no active players are in queue.
4. **FIDE-Standard ELO Rating Engine**: Adaptive rating adjustments based on opponent rating disparity, win/loss history, and performance streak multipliers.
5. **Hybrid Multi-Language Judge**: Executes code in **JavaScript** (via in-process Node V8 sandbox in ~11ms), and **Python**, **C++**, and **Java** via cloud-isolated sandboxes (OnlineCompiler.io) with automatic fallback to local system compilers.

---

## 🏗️ System Architecture & Tech Stack

```
                     ┌──────────────────────────────────────────────┐
                     │          React + Vite + Tailwind CSS         │
                     │          (Frontend Client - Port 3000)       │
                     └──────┬────────────────────────────────┬──────┘
                            │ REST APIs                      │ WebSockets (ws://)
                            ▼                                ▼
                     ┌──────────────────────────────────────────────┐
                     │            Node.js + Express Server          │
                     │          (Backend Service - Port 4000)       │
                     └──────┬──────────────────────┬─────────┬──────┘
                            │                      │         │
               ┌────────────▼─────────┐            │         │
               │   MongoDB Database   │            │         │
               │ (Users, ELO, History)│            │         │
               └──────────────────────┘            │         │
                                                   ▼         ▼
        ┌──────────────────────────────────────────────┐ ┌───────────────────────────┐
        │       Hybrid Dual-Engine Code Judge          │ │  Real-Time Arena Manager  │
        ├──────────────────────┬───────────────────────┤ ├───────────────────────────┤
        │  JavaScript (V8 VM)  │ C++ / Python / Java   │ │ Matchmaking Queue         │
        │  • In-process sandbox│ • OnlineCompiler.io   │ │ Bot Fallback Orchestrator │
        │  • Sub-15ms latency  │ • Local Windows backup│ │ Live ELO Rating Engine    │
        └──────────────────────┴───────────────────────┘ └───────────────────────────┘
```

### Core Technologies
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Web Audio API.
- **Backend**: Node.js, Express, TypeScript (`tsx`), `ws` (WebSockets), `jsonwebtoken` (JWT), `bcryptjs`, `zod`.
- **Database**: MongoDB with Mongoose ODM (Users, Submissions, Arena History, User Stats).
- **Code Execution**:
  - *JavaScript*: Node.js native V8 `vm.runInContext` sandbox.
  - *C++ (`g++-15`)*: OnlineCompiler.io REST API + batch harness.
  - *Python (`python-3.14`)*: OnlineCompiler.io REST API + batch harness (with local Python 3.13 fallback).
  - *Java (`openjdk-25`)*: OnlineCompiler.io REST API + batch harness with import hoisting (with local Java 21 LTS fallback).

---

## 📁 Repository Structure

```
DSA Major Project/
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── judge/
│   │   │   │   ├── online-compiler.ts   # OnlineCompiler.io cloud execution engine
│   │   │   │   ├── compilers.ts         # Local Windows/Linux binary auto-detector
│   │   │   │   └── harness.ts           # Batch test harness & output normalization
│   │   │   ├── arena/                   # Arena matchmaking, bot AI, & WebSocket rooms
│   │   │   ├── elo.ts                   # FIDE standard ELO rating engine
│   │   │   └── audio.ts                 # Web Audio synthesizer triggers
│   │   ├── models/                      # MongoDB Schemas (User, Battle, Match)
│   │   ├── routes/                      # REST API routes (auth, run, problems, progress)
│   │   ├── server.ts                    # Express + WebSocket HTTP server entrypoint
│   │   └── scripts/seed.ts              # Database seeding script for demo data
│   ├── .env                             # Environment configuration (PORT, DB, API key)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/                  # UI components (Visualizers, Navbar, Editor)
│   │   │   └── visualizers/             # Step-by-step animated DSA algorithms
│   │   ├── pages/                       # Route pages (Home, Arena, Learn, Practice, Profile)
│   │   ├── lib/                         # State stores, API clients, and WebSocket hooks
│   │   ├── App.tsx                      # App root with routing
│   │   └── main.tsx                     # React DOM bootstrap
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── modules/                             # Shared data models, problem sets, and test cases
│   ├── data/problems.ts                 # Full problem bank with unit test cases
│   └── data/problem-langs.ts            # Multi-language signatures and solutions
├── package.json                         # Root project scripts
└── README.md                            # Comprehensive project manual
```

---

## 🚀 Step-by-Step Guide: How to Run the Project

### 1. Prerequisites
Ensure the following are installed on your system:
1. **Node.js**: Version 18 or newer ([Download Node.js](https://nodejs.org/))
2. **MongoDB**: Local MongoDB Community Server running on `localhost:27017` or a MongoDB Atlas connection string.
3. **Internet Connection**: For real-time cloud compiler judging via OnlineCompiler.io.

---

### 2. Quick-Start (Terminal 1 — Backend)

1. Open your terminal and navigate to the backend folder:
   ```bash
   cd "backend"
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Check your `.env` file inside `backend/.env`. It is already pre-configured:
   ```env
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/dsa-gaming
   JWT_SECRET=codeclash-access-secret-dev
   JWT_REFRESH_SECRET=codeclash-refresh-secret-dev
   FRONTEND_URL=http://localhost:3000
   ONLINE_COMPILER_API_KEY=fca0c882d1c90190aca2a11e1ac89c79
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *You will see:*
   ```
   ✅ MongoDB connected: mongodb://localhost:27017/dsa-gaming
   🚀 Backend running on http://localhost:4000
   ⚔️ Real-time Arena WebSocket running on ws://localhost:4000
   ```

---

### 3. Quick-Start (Terminal 2 — Frontend)

1. Open a second terminal window and navigate to the frontend folder:
   ```bash
   cd "frontend"
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🔑 Demo Account Credentials

For instant testing without registering a new account, use the pre-seeded account:
- **Username / Identifier**: `demo`
- **Password**: `demo1234`
*(Or click "Register" on the frontend to create a new profile with starting ELO 1200)*.

---

## 🧪 Verifying Key Features

1. **Interactive Visualizers**:
   - Go to `http://localhost:3000/learn`
   - Select any algorithm (e.g. *Two Pointers*, *Sliding Window*, *Binary Search*, *Linked List*, *Graph Traversal*).
   - Use the **Play**, **Step Next**, and **Speed Slider** to observe pointers, active memory windows, and variable mutations in real time.
2. **Multi-Language Compiler**:
   - Open any practice problem (e.g., `Two Sum`).
   - Switch language between **JavaScript**, **Python**, **C++**, and **Java**.
   - Click **Run Code** or **Submit Solution**.
   - Test cases are evaluated dynamically with instant feedback.
3. **1v1 Arena Duels & Bot Fallback**:
   - Click **Arena** in the top navigation bar.
   - Click **Find Match**.
   - If another player is online, you will be paired instantly; otherwise, the intelligent **Bot Fallback** pairs you after 5 seconds for immediate action.
   - Complete the problem before the opponent to gain ELO points and rank up!
