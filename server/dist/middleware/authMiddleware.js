"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'hirelensai_jwt_secure_auth_secret_key_2026';
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Token could be passed in Bearer format
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Access token is missing. Please log in.'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attach user payload to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name
        };
        next();
    }
    catch (error) {
        console.warn('⚠️ [auth-middleware]: Failed to verify token:', error.message);
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Access token is invalid or has expired. Please log in again.'
        });
    }
};
exports.authenticateToken = authenticateToken;
