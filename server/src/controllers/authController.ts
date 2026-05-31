import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { AuthRequest } from '../@types/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hirelensai_jwt_secure_auth_secret_key_2026';

// Email regex validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new job seeker
 */
export const register = async (req: Request, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;

  // 1. Basic validation
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Missing Fields', message: 'All fields are required.' });
  }

  if (name.trim().length < 2) {
    return res.status(400).json({ error: 'Validation Error', message: 'Name must be at least 2 characters.' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Please provide a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 6 characters long.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Validation Error', message: 'Passwords do not match.' });
  }

  try {
    // 2. Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Conflict Error', message: 'An account with this email already exists.' });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Save user
    const newUser = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const userPayload = newUser.rows[0];

    // 5. Generate JWT Token
    const token = jwt.sign(
      { id: userPayload.id, email: userPayload.email, name: userPayload.name },
      JWT_SECRET,
      { expiresIn: '7d' } // Session persists for 7 days
    );

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userPayload.id,
        name: userPayload.name,
        email: userPayload.email,
        created_at: userPayload.created_at
      }
    });

  } catch (error: any) {
    console.error('❌ [auth-controller-register-error]:', error);
    return res.status(500).json({ error: 'Server Error', message: 'Internal server registration failure.' });
  }
};

/**
 * Login existing user
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing Fields', message: 'Email and password are required.' });
  }

  try {
    // 1. Fetch user by email
    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // 2. Check password hash match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Authentication Failed', message: 'Invalid email or password.' });
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error: any) {
    console.error('❌ [auth-controller-login-error]:', error);
    return res.status(500).json({ error: 'Server Error', message: 'Internal server login failure.' });
  }
};

/**
 * Fetch authenticated user details (verification/session persistence check)
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No active session verified.' });
  }

  try {
    const result = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not Found', message: 'User profile does not exist.' });
    }

    const user = result.rows[0];
    return res.status(200).json({
      user
    });

  } catch (error: any) {
    console.error('❌ [auth-controller-me-error]:', error);
    return res.status(500).json({ error: 'Server Error', message: 'Internal server profile request failure.' });
  }
};
