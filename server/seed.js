require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Module = require('./models/Module');
const Quiz = require('./models/Quiz');

const modules = [
    {
        id: 'sorting',
        title: 'Sorting Algorithms',
        description: 'Learn how sorting algorithms work through visual step-by-step execution',
        icon: '🔄',
        difficulty: 'Beginner',
        levels: [
            { levelId: 1, title: 'Bubble Sort – Concept', type: 'concept', description: 'Watch Bubble Sort in action with animated bars and synchronized pseudocode.' },
            { levelId: 2, title: 'Bubble Sort – Interactive', type: 'interactive', description: 'Click pairs of bars to compare and swap them yourself!' },
            { levelId: 3, title: 'Selection Sort – Practice', type: 'practice', description: 'Apply Selection Sort step-by-step with guided hints.' },
            { levelId: 4, title: 'Sorting Quiz', type: 'quiz', description: 'Test your understanding of sorting algorithms.' }
        ]
    },
    {
        id: 'stack-queue',
        title: 'Stack & Queue',
        description: 'Understand LIFO and FIFO data structures with interactive operations',
        icon: '📚',
        difficulty: 'Beginner',
        levels: [
            { levelId: 1, title: 'Stack – Concept & Operations', type: 'concept', description: 'Understand LIFO with visual push and pop animations.' },
            { levelId: 2, title: 'Queue – Concept & Operations', type: 'concept', description: 'Understand FIFO with enqueue and dequeue animations.' },
            { levelId: 3, title: 'Interactive Stack & Queue', type: 'interactive', description: 'Operate the stack and queue yourself!' },
            { levelId: 4, title: 'Stack & Queue Quiz', type: 'quiz', description: 'Test your LIFO and FIFO knowledge.' }
        ]
    },
    {
        id: 'trees',
        title: 'Tree Basics',
        description: 'Master hierarchical data structures and tree traversal techniques',
        icon: '🌳',
        difficulty: 'Intermediate',
        levels: [
            { levelId: 1, title: 'Binary Tree – Introduction', type: 'concept', description: 'Understand nodes, roots, leaves and tree structure.' },
            { levelId: 2, title: 'BST Insertion – Interactive', type: 'interactive', description: 'Insert numbers and watch the BST build itself!' },
            { levelId: 3, title: 'Tree Traversals', type: 'practice', description: 'Visualize In-order, Pre-order, and Post-order traversals.' },
            { levelId: 4, title: 'Trees Quiz', type: 'quiz', description: 'Test your tree knowledge.' }
        ]
    }
];

const quizzes = [
    {
        moduleId: 'sorting',
        questions: [
            {
                question: 'What is the time complexity of Bubble Sort in the worst case?',
                options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
                correctIndex: 2,
                explanation: 'Bubble Sort compares each pair in every pass, leading to O(n²) in the worst case.'
            },
            {
                question: 'In Bubble Sort, after the first complete pass, which element is guaranteed to be in its correct position?',
                options: ['The smallest element', 'The largest element', 'The middle element', 'The first element'],
                correctIndex: 1,
                explanation: 'After the first pass, the largest element "bubbles up" to the last position.'
            },
            {
                question: 'Which sorting algorithm finds the minimum element and places it at the beginning in each pass?',
                options: ['Bubble Sort', 'Insertion Sort', 'Selection Sort', 'Merge Sort'],
                correctIndex: 2,
                explanation: 'Selection Sort selects the minimum from the unsorted part and swaps it to the front.'
            },
            {
                question: 'How many swaps does Selection Sort perform compared to Bubble Sort?',
                options: ['More swaps', 'Same number of swaps', 'Fewer swaps', 'None'],
                correctIndex: 2,
                explanation: 'Selection Sort makes at most n-1 swaps (one per pass), fewer than Bubble Sort.'
            },
            {
                question: 'Which of these sorting algorithms is considered stable?',
                options: ['Selection Sort', 'Bubble Sort', 'Both', 'Neither'],
                correctIndex: 1,
                explanation: 'Bubble Sort is stable because equal elements maintain their relative order. Selection Sort is not.'
            }
        ]
    },
    {
        moduleId: 'stack-queue',
        questions: [
            {
                question: 'What does LIFO stand for?',
                options: ['Last In First Out', 'Last In Fixed Order', 'Left In First Out', 'Least Integer Fixed Order'],
                correctIndex: 0,
                explanation: 'LIFO means the last element inserted is the first one to be removed, like a stack of plates.'
            },
            {
                question: 'Which operation removes an element from the top of a stack?',
                options: ['push', 'enqueue', 'pop', 'dequeue'],
                correctIndex: 2,
                explanation: 'pop() removes the top element from the stack.'
            },
            {
                question: 'What happens when you try to pop from an empty stack?',
                options: ['Returns null', 'Returns 0', 'Stack Overflow', 'Stack Underflow'],
                correctIndex: 3,
                explanation: 'Popping from an empty stack causes Stack Underflow.'
            },
            {
                question: 'In a Queue, where are elements added?',
                options: ['Front', 'Middle', 'Rear', 'Random position'],
                correctIndex: 2,
                explanation: 'Elements are enqueued (added) at the Rear and dequeued (removed) from the Front.'
            },
            {
                question: 'Which real-world scenario best represents a Queue?',
                options: ['Undo feature in editors', 'Browser history', 'Printer job queue', 'Function call stack'],
                correctIndex: 2,
                explanation: 'A printer processes jobs in the order they arrive — FIFO — just like a Queue.'
            }
        ]
    },
    {
        moduleId: 'trees',
        questions: [
            {
                question: 'What is a Binary Search Tree (BST) property?',
                options: [
                    'Left child > Parent, Right child < Parent',
                    'Left child < Parent, Right child > Parent',
                    'All nodes are equal',
                    'Parent is always the largest'
                ],
                correctIndex: 1,
                explanation: 'In a BST, left subtree nodes are smaller and right subtree nodes are greater than the parent.'
            },
            {
                question: 'Which traversal visits nodes in sorted order in a BST?',
                options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
                correctIndex: 2,
                explanation: 'In-order traversal (Left → Root → Right) visits BST nodes in ascending sorted order.'
            },
            {
                question: 'What is the root of a tree?',
                options: ['The last inserted node', 'The node with no children', 'The topmost node', 'The node with two children'],
                correctIndex: 2,
                explanation: 'The root is the topmost node of a tree with no parent.'
            },
            {
                question: 'What is a leaf node in a tree?',
                options: ['A node with one child', 'A node with no children', 'The root node', 'A node with two children'],
                correctIndex: 1,
                explanation: 'A leaf node has no children — it is at the bottom of the tree.'
            },
            {
                question: 'In Pre-order traversal, which node is visited first?',
                options: ['Left child', 'Right child', 'Root', 'Leaf'],
                correctIndex: 2,
                explanation: 'Pre-order traversal visits Root first, then Left subtree, then Right subtree.'
            }
        ]
    }
];

const seed = async () => {
    await connectDB();
    await Module.deleteMany({});
    await Quiz.deleteMany({});
    await Module.insertMany(modules);
    await Quiz.insertMany(quizzes);
    console.log('✅ Database seeded successfully!');
    process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
