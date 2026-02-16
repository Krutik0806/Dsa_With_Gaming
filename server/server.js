const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'DSA with Gaming API Server',
        version: '1.0.0',
        status: 'running'
    });
});

// API Routes
app.get('/api/modules', (req, res) => {
    // For now, returning static data
    // Later, this will fetch from MongoDB
    res.json({
        success: true,
        data: [
            {
                id: 'sorting',
                title: 'Sorting Algorithms',
                description: 'Learn sorting through visualization',
                icon: '🔄',
                levels: 4
            },
            {
                id: 'stack-queue',
                title: 'Stack & Queue',
                description: 'Master LIFO and FIFO structures',
                icon: '📚',
                levels: 3
            },
            {
                id: 'trees',
                title: 'Tree Basics',
                description: 'Understand hierarchical data',
                icon: '🌳',
                levels: 4
            }
        ]
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
});
