// ─── Rapid-fire quiz battle question bank ────────────────────────────────────

export interface QuizQuestion {
  id: string;
  category: string;
  difficulty: 1 | 2 | 3; // 1 = easy, 3 = hard
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}

export const QUIZ_CATEGORIES = [
  "Complexity",
  "Arrays & Hashing",
  "Lists, Stacks & Queues",
  "Trees & Graphs",
  "Sorting & Searching",
  "Recursion & DP",
  "CS Fundamentals",
] as const;

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // ── Complexity ──
  { id: "cx1", category: "Complexity", difficulty: 1, q: "What is the time complexity of accessing an array element by its index?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 0, explanation: "Arrays are contiguous in memory, so arr[i] is a single address computation — constant time." },
  { id: "cx2", category: "Complexity", difficulty: 1, q: "Binary search over a sorted array of 1,000,000 elements needs at most about how many comparisons?", options: ["About 20", "About 1000", "About 500,000", "About 1,000,000"], answer: 0, explanation: "Each comparison halves the space: log₂(10⁶) ≈ 20." },
  { id: "cx3", category: "Complexity", difficulty: 2, q: "What is the complexity of 'for i in 0..n: for j in i..n: work()'?", options: ["O(n)", "O(n log n)", "O(n²)", "O(2ⁿ)"], answer: 2, explanation: "The inner loop runs n, n−1, n−2 … times, totaling n(n+1)/2 ≈ n²/2 → O(n²)." },
  { id: "cx4", category: "Complexity", difficulty: 2, q: "Simplifying 3n² + 5n + 7 in Big-O terms gives…", options: ["O(3n²)", "O(n² + n)", "O(n²)", "O(n³)"], answer: 2, explanation: "Drop constants and lower-order terms: only the fastest-growing term matters." },
  // ── Arrays & Hashing ──
  { id: "ah1", category: "Arrays & Hashing", difficulty: 1, q: "Which structure gives average O(1) lookup by key?", options: ["Sorted array", "Hash map", "Balanced BST", "Linked list"], answer: 1, explanation: "Hash maps hash the key directly to a bucket — constant average time." },
  { id: "ah2", category: "Arrays & Hashing", difficulty: 2, q: "The optimal strategy for Two Sum runs in…", options: ["O(n²) with nested loops", "O(n log n) with sorting", "O(n) with a hash map", "O(log n) with binary search"], answer: 2, explanation: "Store value → index as you scan; each complement lookup is O(1) average." },
  { id: "ah3", category: "Arrays & Hashing", difficulty: 2, q: "Prefix sums answer which query in O(1) after O(n) preprocessing?", options: ["Sum of any subarray", "Minimum of any subarray", "Longest sorted run", "Most frequent element"], answer: 0, explanation: "sum(l..r) = prefix[r+1] − prefix[l] — one subtraction." },
  { id: "ah4", category: "Arrays & Hashing", difficulty: 2, q: "The sliding-window technique for 'longest substring without repeats' achieves…", options: ["O(n³)", "O(n²)", "O(n)", "O(n log n)"], answer: 2, explanation: "Both pointers only move forward, so the total work is linear." },
  { id: "ah5", category: "Arrays & Hashing", difficulty: 1, q: "Inserting at the FRONT of a dynamic array costs…", options: ["O(1) always", "O(n) — every element shifts", "O(log n)", "O(n log n)"], answer: 1, explanation: "All n existing elements move one slot right. Insert at the END is the O(1)-amortized one." },
  // ── Lists, Stacks & Queues ──
  { id: "sq1", category: "Lists, Stacks & Queues", difficulty: 1, q: "A stack processes elements in which order?", options: ["FIFO", "LIFO", "By priority", "Randomly"], answer: 1, explanation: "Last-In, First-Out — the most recent push pops first." },
  { id: "sq2", category: "Lists, Stacks & Queues", difficulty: 1, q: "A queue processes elements in which order?", options: ["LIFO", "FIFO", "By key", "Alphabetically"], answer: 1, explanation: "First-In, First-Out — like a line at a counter." },
  { id: "sq3", category: "Lists, Stacks & Queues", difficulty: 2, q: "Which structure is the natural backbone of an editor's undo history?", options: ["Queue", "Stack", "Heap", "Trie"], answer: 1, explanation: "Undo reverses the most recent action first — LIFO." },
  { id: "sq4", category: "Lists, Stacks & Queues", difficulty: 2, q: "Detecting balanced parentheses is classically solved with…", options: ["A hash map", "A stack", "Binary search", "A priority queue"], answer: 1, explanation: "Push openers, pop on closers — the top always holds the nearest unclosed opener." },
  { id: "sq5", category: "Lists, Stacks & Queues", difficulty: 2, q: "Inserting a new node at the HEAD of a singly linked list costs…", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: 0, explanation: "Rewire one pointer: newNode.next = head; head = newNode." },
  // ── Trees & Graphs ──
  { id: "tg1", category: "Trees & Graphs", difficulty: 1, q: "The BST invariant says that for every node…", options: ["left subtree values are smaller, right subtree values are larger", "the tree is perfectly balanced", "every node has exactly two children", "values increase level by level"], answer: 0, explanation: "Everything left of a node is smaller; everything right is larger — that's what guides search." },
  { id: "tg2", category: "Trees & Graphs", difficulty: 1, q: "Searching a balanced BST with n nodes costs…", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], answer: 1, explanation: "Each comparison discards a subtree — the cost is the height, log₂ n when balanced." },
  { id: "tg3", category: "Trees & Graphs", difficulty: 2, q: "BFS and DFS differ primarily in their use of…", options: ["a queue vs a stack", "recursion vs iteration only", "O(n) vs O(n²) always", "hashing vs sorting"], answer: 0, explanation: "BFS explores level-by-level with a queue; DFS dives with a stack (or the call stack)." },
  { id: "tg4", category: "Trees & Graphs", difficulty: 2, q: "Shortest path (fewest edges) in an unweighted graph is found by…", options: ["DFS", "BFS", "Greedy sorting", "Binary search"], answer: 1, explanation: "BFS visits nodes in increasing distance, so first arrival = shortest path." },
  { id: "tg5", category: "Trees & Graphs", difficulty: 2, q: "A tree with n nodes contains exactly how many edges?", options: ["n", "n − 1", "n + 1", "log n"], answer: 1, explanation: "Every node except the root has exactly one parent edge." },
  { id: "tg6", category: "Trees & Graphs", difficulty: 3, q: "The time complexity of DFS on a graph with V vertices and E edges is…", options: ["O(V)", "O(E)", "O(V + E)", "O(V · E)"], answer: 2, explanation: "Every vertex is visited once and every edge traversed once." },
  // ── Sorting & Searching ──
  { id: "ss1", category: "Sorting & Searching", difficulty: 1, q: "Merge sort's worst-case time complexity is…", options: ["O(n²)", "O(n log n)", "O(n)", "O(log n)"], answer: 1, explanation: "log n levels of merging, each touching n elements — guaranteed n log n." },
  { id: "ss2", category: "Sorting & Searching", difficulty: 1, q: "Binary search requires the input to be…", options: ["distinct", "sorted", "numeric", "of even length"], answer: 1, explanation: "Sortedness is what lets one comparison discard half the space." },
  { id: "ss3", category: "Sorting & Searching", difficulty: 2, q: "Quick sort's worst case, O(n²), occurs when…", options: ["the array is already sorted and pivots are chosen poorly", "the array has duplicates", "n is prime", "memory is contiguous"], answer: 0, explanation: "Poor pivots (e.g. first element on sorted input) split 0 / n−1 every time." },
  { id: "ss4", category: "Sorting & Searching", difficulty: 2, q: "Which of these sorts is stable?", options: ["Quick sort", "Heap sort", "Merge sort", "Selection sort"], answer: 2, explanation: "Merge sort never swaps equal elements across each other, so ties keep their order." },
  { id: "ss5", category: "Sorting & Searching", difficulty: 3, q: "Building a heap from n elements with heapify costs…", options: ["O(n log n)", "O(n)", "O(log n)", "O(n²)"], answer: 1, explanation: "Sifting down from the bottom levels, most nodes move very little — the series sums to O(n)." },
  // ── Recursion & DP ──
  { id: "rd1", category: "Recursion & DP", difficulty: 1, q: "Naive recursive Fibonacci runs in…", options: ["O(n)", "O(n log n)", "O(2ⁿ)", "O(1)"], answer: 2, explanation: "The call tree nearly doubles at every level — exponential blow-up from recomputation." },
  { id: "rd2", category: "Recursion & DP", difficulty: 2, q: "Memoized Fibonacci runs in…", options: ["O(2ⁿ)", "O(n²)", "O(n)", "O(log n)"], answer: 2, explanation: "Each of the n subproblems is computed once; repeats are cache hits." },
  { id: "rd3", category: "Recursion & DP", difficulty: 2, q: "A problem is solvable with DP when it exhibits…", options: ["sorted inputs and distinct keys", "overlapping subproblems and optimal substructure", "balanced trees and acyclicity", "monotonic predicates"], answer: 1, explanation: "Overlap makes caching profitable; optimal substructure makes assembly valid." },
  { id: "rd4", category: "Recursion & DP", difficulty: 2, q: "'How many distinct ways to climb n stairs taking 1 or 2 steps?' is which recurrence?", options: ["ways(n) = ways(n−1) × 2", "ways(n) = ways(n−1) + ways(n−2)", "ways(n) = n!", "ways(n) = 2ⁿ"], answer: 1, explanation: "The last hop came from n−1 or n−2 — the Fibonacci recurrence." },
  { id: "rd5", category: "Recursion & DP", difficulty: 3, q: "Kadane's algorithm computes, in O(n)…", options: ["the longest sorted subarray", "the maximum subarray sum", "the closest pair of points", "the median of two arrays"], answer: 1, explanation: "At each index it decides: extend the current run, or restart from here." },
  { id: "rd6", category: "Recursion & DP", difficulty: 3, q: "The base case of a recursive function must…", options: ["run in constant time", "not recurse", "return zero", "be memoized"], answer: 1, explanation: "The base case terminates recursion — every path must reach it." },
  // ── CS Fundamentals ──
  { id: "cs1", category: "CS Fundamentals", difficulty: 2, q: "A hash map's worst-case single-key lookup degrades to O(n) when…", options: ["all keys collide into one bucket", "the map is resized", "values are strings", "n exceeds 1000"], answer: 0, explanation: "Heavy collisions pile entries into one bucket, forcing a linear scan there." },
  { id: "cs2", category: "CS Fundamentals", difficulty: 1, q: "Which memory region stores function call frames?", options: ["The heap", "The stack", "Static storage", "Registers"], answer: 1, explanation: "The call stack: each call pushes a frame, each return pops one. Deep recursion overflows it." },
  { id: "cs3", category: "CS Fundamentals", difficulty: 3, q: "A stack overflow during recursion most directly means…", options: ["heap fragmentation", "the recursion has no base case or is too deep", "an integer overflow", "a memory leak"], answer: 1, explanation: "Frames accumulate without popping — either a missing base case or depth beyond the stack's size." },
];

/** Deterministic PRNG (mulberry32) — two clients given the same seed get the
 *  same question set, which is how live human-vs-human battles stay in sync. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickQuizQuestions(count: number, seed?: number): QuizQuestion[] {
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const pool = [...QUIZ_QUESTIONS];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
