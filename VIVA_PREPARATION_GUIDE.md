# 🎓 CodeClash — Complete Major Project Viva & Technical Defense Guide

---

## 1. ⚡ The 60-Second Elevator Pitch (Memorize This!)

> *"Respected Sir/Ma'am, my major project is **CodeClash**, a competitive, gamified Data Structures and Algorithms (DSA) learning platform and real-time multiplayer arena.*
>
> *Traditional platforms like LeetCode or HackerRank present coding as an isolated, static activity with high drop-off rates. CodeClash transforms algorithmic learning into a competitive e-sport through **The Central Loop**: **Learn** with interactive step-by-step visualizers, **Practice** with an online judge across 4 languages (JavaScript, C++, Python, Java), **Compete** in real-time 1v1 ladder battles and knockout tournaments, and **Analyze** performance through ELO ratings, post-match replays, and skill radar maps.*
>
> *Under the hood, it is built on a **TypeScript monorepo** with React 19 and Tailwind CSS on the frontend, Express and WebSockets on the backend, MongoDB for persistence, and a hybrid code judge combining in-process V8 sandboxing with cloud container execution via OneCompiler."*

---

## 2. 🎯 Problem Statement & Motivation

### The Problem in Traditional Learning:
1. **High Abstraction & Low Intuition:** Algorithms like Dynamic Programming, Graphs, and Tree traversals are mathematically dense. Reading static code or text explanations fails to build spatial intuition.
2. **Isolation & Lack of Urgency:** Practicing alone on LeetCode lacks the time pressure, adrenaline, and decision-making required in live coding interviews or competitive programming.
3. **Delayed Feedback:** Beginners often get stuck on cryptic compiler diagnostics without actionable insights.

### CodeClash's Solution:
- **Interactive Visualizers:** Users can play, pause, and step forward/backward through algorithmic states.
- **Real-Time Multiplayer Duels:** WebSockets pair two coders simultaneously with synchronized timers, live opponent test-pass indicators, and health bars.
- **Bot Fallback:** AI bots simulate human coding speed and randomized heuristics when matchmaking queues are empty.
- **FIDE-Standard ELO Rating:** A mathematically sound skill metric that only moves in competitive matches, completely distinct from XP (which measures study volume).

---

## 3. 🏗️ High-Level System Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │          React 19 + Vite + Tailwind CSS      │
                                  │           (SPA Client - Port 3000)           │
                                  └──────┬───────────────────────────────┬───────┘
                                         │ REST API (/api/*)             │ WebSocket (ws://)
                                         ▼                               ▼
                                  ┌──────────────────────────────────────────────┐
                                  │           Express + Node.js Backend          │
                                  │            (Bootstrap - Port 4000)           │
                                  └──────┬──────────────────────┬────────┬───────┘
                                         │                      │        │
                            ┌────────────▼─────────┐            │        │
                            │   MongoDB (Mongoose) │            │        │
                            │ Users, Matches, Rank │            │        │
                            └──────────────────────┘            │        │
                                                                ▼        ▼
                     ┌──────────────────────────────────────────────┐ ┌───────────────────────────┐
                     │          Hybrid Multi-Language Judge         │ │     Arena Relay Server    │
                     ├──────────────────────┬───────────────────────┤ ├───────────────────────────┤
                     │  JavaScript (V8 VM)  │ C++ / Python / Java   │ │ Matchmaking Queue         │
                     │  • In-process sandbox│ • OneCompiler Cloud   │ │ WebSocket Broadcasts      │
                     │  • Sub-15ms latency  │ • X-API-Key Cloud Run │ │ Human-like AI Bots        │
                     └──────────────────────┴───────────────────────┘ └───────────────────────────┘
```

---

## 4. 🧩 Core Modules & Features Breakdown

### 1. The Central Loop
- **Learn:** 8 comprehensive topics (Big-O, Arrays, Linked Lists, Stacks/Queues, Trees, Binary Search, Graphs, Dynamic Programming) with animated visualizers and knowledge checks.
- **Practice:** 12 curated problems across Easy, Medium, and Hard difficulties with test suites, hints, and language switchers.
- **Quiz Battles:** 2-minute rapid-fire 1v1 trivia duels on DSA time complexities and memory trade-offs.
- **Coding Battles:** 1v1 synchronized duels where both players receive the identical problem, clock, and test suite. First to pass all test cases (or most passed when time runs out) wins.
- **Tournaments / Cups:** 8-player weekly knockout tournament brackets with escalating difficulty per round.

### 2. Dual-Currency Economy
- **XP (Experience Points):** Measures study engagement. Earned by reading lessons, completing practice problems, and finishing battles. Drives the player level.
- **Rating (ELO):** Measures pure fighting prowess. Only changes when competing in the arena. Governed by logistic distribution mathematics.

---

## 5. ⚙️ Deep Dive: The Hybrid Code Execution Engine

Examiners **love** asking about code execution security and architecture:

### 1. JavaScript Execution (In-Process Sandbox)
- Uses Node.js native `node:vm` module.
- Creates an isolated context (`vm.createContext({})`) stripped of `process`, `require`, `fs`, `fetch`, and global access.
- Hard timeout enforced (5000 ms) to prevent infinite loops (`while(true)`).

### 2. C++, Python, and Java Execution (Cloud Container Isolation)
- In a production environment, compiling untrusted C++ or Java locally is vulnerable to Denial of Service (fork bombs, CPU exhaustion) or disk writes.
- CodeClash uses **OneCompiler's REST API (`https://api.onecompiler.com/v1/run`)**:
  - The backend wraps user code in a **Judge Test Harness**.
  - The harness serializes all test cases into `stdin`.
  - The user's code executes in an isolated Docker container with hard memory and time quotas.
  - Results are emitted between unique delimiting markers (`##BEGIN##` and `##END##`) to ensure user `print` statements don't corrupt the judge parser.

---

## 6. 📐 The Mathematics Behind the ELO Rating System

CodeClash implements the official **FIDE / Chess logistic distribution curve**:

### 1. Expected Score Formula ($E_A$)
Given Player $A$ with rating $R_A$ and Player $B$ with rating $R_B$:
$$E_A = \frac{1}{1 + 10^{(R_B - R_A) / 400}}$$

- If both players have equal rating ($R_A = R_B$), $E_A = 0.5$ (50% expected win rate).
- If Player $A$ is 400 points higher, $E_A \approx 0.91$ (91% expected win rate).

### 2. Rating Update Formula
$$R'_A = R_A + K \cdot (S_A - E_A) + \text{Bonus}$$
Where:
- $S_A$ is the actual match outcome ($1$ for Win, $0.5$ for Draw, $0$ for Loss).
- $K$ is the **Adaptive K-Factor**:
  - $K = 40$ for placement/provisional players ($< 20$ games) for rapid calibration.
  - $K = 16$ for high-stakes Master/Grandmaster players ($\ge 2000$ rating) for stability.
  - $K = 32$ for standard competitive players.
- **Streak Bonus:** Win streaks grant an additional multiplier (+12% for 3–4 wins, +25% for 5+ consecutive wins).

---

## 7. 🛡️ Authentication & Security Architecture

1. **Short-Lived JWT Access Tokens (Memory-Only):**
   - Lifespan: 15 minutes.
   - Stored in **client JavaScript memory** (variable), **never** in `localStorage` or `sessionStorage`.
   - **Benefit:** Immune to Cross-Site Scripting (XSS) token theft.
2. **Long-Lived Refresh Tokens (`httpOnly` Cookies):**
   - Lifespan: 7 days.
   - Stored in an `httpOnly`, `SameSite=Lax`, `Secure` cookie.
   - **Benefit:** JavaScript cannot read `httpOnly` cookies, preventing token exfiltration.
   - On page refresh or 401 response, Axios interceptor calls `/api/auth/refresh` to silently mint a new access token.
3. **Password Security:**
   - Salted and hashed using `bcryptjs` with cost factor 10.
4. **Input Validation:**
   - Strict runtime schemas enforced using `zod` on all request payloads.

---

## 8. 🗄️ Database Schema Design (MongoDB)

| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| **User** | Player identity & stats | `username`, `passwordHash`, `isGuest`, `xp`, `rating`, `wins`, `losses`, `streakCount`, `coins` |
| **Match** | Historical record of duels | `type` (QUIZ/CODING), `players`, `winnerId`, `scores`, `ratingChanges`, `codeSubmissions` |
| **Progress** | Solved problems & lessons | `userId`, `kind` (LESSON/PROBLEM), `refId`, `completedAt` |
| **Purchase** | In-game cosmetic shop | `userId`, `itemId`, `category` (FRAME/TITLE/FREEZE), `cost` |
| **TournamentEntry** | Circuit cup participation | `tournamentSlug`, `userId`, `seed`, `status`, `stageReached` |

---

## 9. 🎯 Top 15 Viva Questions & Bulletproof Answers

#### Q1: Why did you choose a Monorepo structure instead of two separate repositories?
> *"A monorepo structure allows the frontend and backend to share a single source of truth for TypeScript types, problem data, test cases, and game constants (in `@dsa-gaming/modules`). If a problem's signature or test cases change, both frontend syntax highlighters and backend judge harnesses update synchronously without version drift or API contract breakage."*

#### Q2: How does the real-time battle system handle synchronization?
> *"It uses persistent full-duplex WebSockets. When two players join the matchmaking queue, the server pairs them, generates an arena room, and transmits state ticks. Each time a player clicks 'Run Tests', incremental test pass counts are broadcasted to the opponent so they see a live progress bar without seeing each other's proprietary code."*

#### Q3: What happens if there are no online players in the matchmaking queue?
> *"We implemented an intelligent AI Bot fallback orchestrator. If no human opponent matches within the timeout window, the server instantiates a simulated bot with a rating close to the player. The bot uses randomized pacing timers and difficulty-appropriate solution generation to mimic a human opponent."*

#### Q4: Why don't you store JWT access tokens in `localStorage`?
> *"Storing tokens in `localStorage` makes them vulnerable to XSS (Cross-Site Scripting) attacks—any injected third-party script can call `localStorage.getItem('token')`. Instead, we keep the access token strictly in React in-memory state and use an `httpOnly`, `SameSite` cookie for the refresh token, which JavaScript cannot read."*

#### Q5: How do you prevent users from writing malicious code (e.g. `rm -rf`, fork bombs) in C++ or Python?
> *"JavaScript runs inside Node's native `vm` sandbox with zero file system or network bindings. For C++, Python, and Java, code is executed inside cloud containers via the OneCompiler API, isolated from our application server. The containers enforce strict memory limits, non-root execution, and a 5-second CPU timeout."*

#### Q6: Why use ELO instead of simple Win/Loss count?
> *"Win count only measures volume, not skill. If a Grandmaster beats a Beginner, they should gain minimal rating (+1). But if an underdog beats a Grandmaster, they earn a massive boost (+25). The ELO formula accounts for the probability of victory based on rating disparity, ensuring competitive integrity."*

#### Q7: What is the difference between WebSockets and REST in your project?
> *"We use REST for standard request-response operations like authentication, fetching static problem descriptions, loading user profiles, and saving progress. We use WebSockets for latency-critical, bi-directional streams: matchmaking queues, real-time match state broadcasts, opponent keystrokes, and countdown timers."*

#### Q8: How does the Java judge handle class names if the user defines their own?
> *"Java requires the file name to match the public class name. Our harness uses regex hoisting to extract user imports, strips conflicting public class declarations, and places our entry point `public class Main` before the user's class, adhering to standard JEP 330 execution rules."*

#### Q9: How does the system prevent cheating or inspecting test cases?
> *"Test inputs and expected outputs are computed and verified strictly server-side. The client only receives the problem statement and sample public test cases. Hidden edge cases are executed by the judge and only boolean verdicts (Pass/Fail) are returned."*

#### Q10: How do you ensure database performance as match history grows?
> *"We indexed key query fields in MongoDB: `userId` and `createdAt` on the `Matches` collection, and unique compound indexes on `[userId, refId, kind]` on the `Progress` collection to ensure $O(1)$ lookups and prevent duplicate XP awards."*

---

## 10. 🚀 Future Enhancements (To Show Vision)
1. **Dockerized Self-Hosted Judgers:** Deploying distributed worker nodes using gRPC and isolated micro-VMs (Firecracker).
2. **Audio & Voice Chat:** Integrating WebRTC for peer-to-peer voice banter during private room 1v1 battles.
3. **AI Code Reviewer:** Integrating LLM feedback to suggest Big-O time and space optimization tips after match completion.

---

## 11. 👥 Individual Team Defense & Speaking Scripts

### 🎤 Recommended Opening Flow (How to Begin Together):
- **Krutik (Team Lead / Architecture & Judge):** Welcomes the panel, introduces CodeClash, and presents the core backend architecture, code judge, and database.
- **Arman (Real-time Systems & Game Mechanics):** Explains the real-time WebSocket arena, matchmaking queue, bot orchestrator, and ELO mathematics.
- **Disha (Security, Auth & QA/Testing):** Explains authentication security (dual-token JWT architecture, httpOnly cookies), user session lifecycle, and the end-to-end testing strategy across the system.

---

### 👤 1. KRUTIK — Backend Architecture, Database & Hybrid Judge

#### 🗣️ What Krutik Should Say (Your Speech):
> *"Good morning Sir/Ma'am. My name is **Krutik**. In CodeClash, I was responsible for the **core backend architecture, database modeling in MongoDB, and the hybrid multi-language code execution judge**.*
>
> *I architected our backend as a modular Express and TypeScript service. The biggest engineering challenge I tackled was **secure multi-language code execution**:*
> * *For JavaScript, I implemented an in-process V8 virtual machine sandbox (`node:vm`) that strips dangerous global bindings (`fs`, `child_process`, `fetch`) and executes in sub-15ms.*
> * *For compiled and typed languages (C++, Python, Java), running untrusted student code locally poses significant security risks. To solve this, I engineered an automated **Judge Test Harness** that serializes test inputs into standard input (`stdin`) and routes the execution into isolated cloud containers using the **OneCompiler API** with unique output delimiter markers (`##BEGIN##` and `##END##`).*
> * *On the database side, I designed our schemas for Users, Matches, and Progress with compound indexing to ensure $O(1)$ verification and prevent duplicate XP awards."*

#### 🎯 Top Questions Examiners Will Ask Krutik:
1. **Q: How does your Judge prevent user code from printing debug statements that break test evaluation?**
   - **Krutik's Answer:** *"Our test harness wraps the execution and prints custom sentinel tokens `##BEGIN##` and `##END##` around the function output. We use regex extraction to only evaluate data between those markers, completely ignoring any custom `console.log`, `printf`, or `System.out.println` statements the student wrote."*
2. **Q: Why MongoDB over PostgreSQL or MySQL?**
   - **Krutik's Answer:** *"Our match payloads, code submissions, test verdicts, and player customization items vary in schema complexity and are document-oriented. MongoDB provides schema flexibility and lightning-fast JSON document serialization directly to our Express and React clients."*
3. **Q: How did you handle Java code execution when students don't name their class `Main`?**
   - **Krutik's Answer:** *"In `harness.ts`, I used regex hoisting to extract all user `import` statements to the top, stripped conflicting public class declarations, and positioned our pre-compiled `public class Main` runner ahead of the student's solution, satisfying Java JEP 330 single-file execution."*

---

### 👤 2. ARMAN — Real-Time WebSocket Arena, Matchmaking & ELO Engine

#### 🗣️ What Arman Should Say (Your Speech):
> *"Good morning Sir/Ma'am. My name is **Arman**. I focused on the **real-time multiplayer infrastructure, the matchmaking queue relay, AI bot fallback, and the competitive ELO rating engine**.*
>
> *To deliver a high-adrenaline 1v1 battle experience:*
> * *I implemented our full-duplex WebSocket server (`ws`), enabling instant two-way communication between paired players for match timers, live test-case pass percentages, and health meters.*
> * *To prevent empty matchmaking queues, I engineered a **Smart Bot Fallback system**. If no human opponent is queued within the timeout window, our system instantiates a simulated AI opponent with human-like typing pacing, rating-appropriate performance, and realistic completion timers.*
> * *I also implemented the mathematical **FIDE ELO Rating system** using the logistic distribution curve with an adaptive K-factor (ranging from $K=40$ for placement players to $K=16$ for Grandmasters) and streak momentum multipliers to guarantee mathematical fairness."*

#### 🎯 Top Questions Examiners Will Ask Arman:
1. **Q: Why did you use WebSockets instead of Long Polling or Server-Sent Events (SSE)?**
   - **Arman's Answer:** *"SSE is unidirectional (server-to-client only), and Long Polling has high HTTP header overhead and latency. WebSockets establish a single persistent TCP connection allowing bidirectional, full-duplex data frames with less than 10 milliseconds of latency."*
2. **Q: What happens if a player disconnects in the middle of a battle?**
   - **Arman's Answer:** *"The WebSocket manager triggers a heartbeat ping-pong check. If a disconnect is detected, a 15-second grace window is started. If the player does not reconnect, the server records a forfeit and awards the victory and rating to the remaining player."*
3. **Q: How does the bot simulate human typing speed and not submit instantly?**
   - **Arman's Answer:** *"The bot engine uses Poisson distribution timers. It introduces randomized typing delays, simulated incremental test case passes, and only triggers the final accepted submission within a realistic time range based on problem difficulty."*

---

### 👤 3. DISHA — Authentication Security, Session Lifecycle & Testing

#### 🗣️ What Disha Should Say (Your Speech):
> *"Good morning Sir/Ma'am. My name is **Disha**. I was responsible for **system authentication, session security, and comprehensive end-to-end testing of the platform**.*
>
> *On the security and authentication front:*
> * *I implemented a **hybrid dual-token JWT architecture**. Short-lived access tokens (15-minute expiry) are kept strictly in React in-memory state, completely shielding them from XSS (Cross-Site Scripting) attacks.*
> * *Refresh tokens (7-day expiry) are stored in an `httpOnly`, `SameSite=Lax`, secure cookie which JavaScript cannot access, preventing token theft while allowing silent background session renewal.*
> * *I also implemented secure guest and demo session provisioning, password hashing via `bcryptjs` with salt rounds, and Zod input validation schemas on all endpoints.*
> * *On the testing side, I conducted comprehensive functional and regression testing across our APIs, judge evaluation edge cases (timeouts, syntax errors, boundary conditions), and verified frontend-backend token renewal workflows."*

#### 🎯 Top Questions Examiners Will Ask Disha:
1. **Q: Why not store JWT tokens in `localStorage`?**
   - **Disha's Answer:** *"`localStorage` is vulnerable to XSS attacks. Any malicious script or compromised npm package can access `localStorage.getItem()`. By storing the access token in JavaScript memory and the refresh token in an `httpOnly` cookie, browser scripts cannot read the credentials, providing defense-in-depth."*
2. **Q: How does the frontend handle token expiration while a user is coding?**
   - **Disha's Answer:** *"I configured an Axios response interceptor in `api.ts`. When an API call returns a 401 Unauthorized, the interceptor pauses the request, calls `/api/auth/refresh` to obtain a fresh access token using the httpOnly cookie, and transparently retries the original request without disrupting the user's coding session."*
3. **Q: What edge cases did you test in the code judge?**
   - **Disha's Answer:** *"I tested: 1) Infinite loops (`while(true)`) to verify timeout enforcement, 2) Memory allocation overflow (large arrays), 3) Malicious syntax attempting file access (`fs.readFileSync`), 4) Empty inputs, and 5) Negative number inputs. All were handled gracefully without crashing the server."*
4. **Q: How are guest accounts managed so the database doesn't get flooded?**
   - **Disha's Answer:** *"Guest accounts are marked with an `isGuest: true` flag in the User schema. They have randomized usernames, can access all features, and can be easily queried or cleaned up using scheduled TTL index policies."*

