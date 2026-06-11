import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../utils/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'empclerp-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const JWT_REFRESH_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 10;

// Helper: build and sign token payload
function signToken(user, expiresIn = JWT_EXPIRES_IN) {
  const payload = {
    user_id: user.user_id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Helper: auto-seed enterprise users if not yet in DB
// Credentials are strong — no default username+123 pattern allowed
async function seedEnterpriseUser(username, password) {
  // Map username -> { role, securePassword }
  const users = {
    'Administrator@2026': { role: 'Admin',       name: 'Administrator',    password: 'SalmanERP@2026@' },
    finance:              { role: 'Finance',     name: 'Finance User',     password: 'SalmanERP@2026@' },
    production:           { role: 'Production',  name: 'Production User',  password: 'SalmanERP@2026@' },
    procurement:          { role: 'Procurement', name: 'Procurement User', password: 'SalmanERP@2026@' },
    sales:                { role: 'Sales',       name: 'Sales User',       password: 'SalmanERP@2026@' },
    hr:                   { role: 'HR',          name: 'HR User',          password: 'SalmanERP@2026@' },
  };

  const entry = users[username];
  // Only seed if the username is recognised AND the supplied password matches exactly
  if (!entry || password !== entry.password) return null;

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const q = await db.query(
    `INSERT INTO app_user (user_id, username, password_hash, name, role, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
     ON CONFLICT (username) DO NOTHING
     RETURNING *`,
    [username, hash, entry.name, entry.role]
  );
  return q.rows[0] || null;
}

/**
 * POST /api/auth/login
 * Accepts { username, password }
 * Returns { token, refreshToken, user }
 */
export const login = async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    // 1. Look up user
    const checkQ = await db.query(
      'SELECT user_id, username, password_hash, role, name FROM app_user WHERE username = $1',
      [username]
    );
    let user = checkQ.rows[0];

    // 2. Auto-seed well-known enterprise users on first login
    if (!user) {
      user = await seedEnterpriseUser(username, password);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    } else {
      // 3. Verify password — only bcrypt hashes accepted (no plain-text fallback)
      const hash = user.password_hash;
      let passwordOk = false;

      if (hash && hash.startsWith('$2')) {
        // Modern bcrypt hash
        passwordOk = await bcrypt.compare(password, hash);
      } else {
        // Old plain-text stored — reject and force a reset via admin
        return res.status(401).json({ success: false, message: 'Your account requires a password reset. Please contact your administrator.' });
      }

      if (!passwordOk) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    }

    // 4. Issue tokens
    const token = signToken(user);
    const refreshToken = signToken(user, JWT_REFRESH_EXPIRES_IN);

    return res.json({
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          user_id: user.user_id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      },
      message: `Welcome back, ${user.name}!`,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/refresh
 * Accepts { refreshToken }
 * Returns a new short-lived { token }
 */
export const refreshToken = async (req, res) => {
  const { refreshToken: incomingRefresh } = req.body || {};

  if (!incomingRefresh) {
    return res.status(400).json({ success: false, message: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(incomingRefresh, JWT_SECRET);

    // Verify user still exists in DB
    const q = await db.query(
      'SELECT user_id, username, name, role FROM app_user WHERE user_id = $1',
      [decoded.user_id]
    );
    const user = q.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    const newToken = signToken(user);
    return res.json({ success: true, data: { token: newToken } });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated user profile.
 */
export const getProfile = (req, res) => {
  return res.json({ success: true, data: { user: req.user } });
};
