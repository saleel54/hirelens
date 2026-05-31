import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../@types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hirelensai_jwt_secure_auth_secret_key_2026';

export interface AuthRequestPayload {
  id: number;
  email: string;
  name: string;
}

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequestPayload;
    
    // Attach user payload to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
  } catch (error: any) {
    console.warn('⚠️ [auth-middleware]: Failed to verify token:', error.message);
    
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access token is invalid or has expired. Please log in again.'
    });
  }
};
