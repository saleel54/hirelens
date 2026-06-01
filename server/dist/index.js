"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const init_js_1 = require("./db/init.js");
const db_js_1 = require("./config/db.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const analysisRoutes_js_1 = __importDefault(require("./routes/analysisRoutes.js"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS with dynamic localhost support for development port shifts
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin)
            return callback(null, true);
        // Check if origin matches allowed list or is any localhost port
        const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
        if (allowedOrigins.includes(origin) || isLocalhost) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
// Parse incoming requests with JSON payloads
app.use(express_1.default.json());
// Register API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/analysis', analysisRoutes_js_1.default);
// Standard API health endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'HireLens AI API Server is initialized and running',
        timestamp: new Date().toISOString()
    });
});
// Global error handler middleware
app.use((err, req, res, next) => {
    console.error('[server-error]:', err.stack || err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});
// Initialize database schema and start server
const startServer = async () => {
    try {
        // Run schema creation if tables don't exist
        await (0, init_js_1.initializeDatabase)();
        app.listen(PORT, () => {
            console.log(`⚡️ [server]: HireLens AI Backend API is active at http://localhost:${PORT}`);
        });
    }
    catch (error) {
        (0, db_js_1.setSandboxMode)(true);
        console.warn('⚠️ [server-warning]: Failed to initialize database on boot, running in Sandbox Mode:', error.message || error);
        app.listen(PORT, () => {
            console.log(`⚡️ [server]: HireLens AI Backend API is active in Sandbox Mode at http://localhost:${PORT}`);
        });
    }
};
startServer();
