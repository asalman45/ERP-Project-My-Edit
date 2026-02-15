import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_DISPLAY_NAME = process.env.ADMIN_DISPLAY_NAME || 'Mr. Jahanzeb';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@empclerp.com';
const JWT_SECRET = process.env.JWT_SECRET || 'empclerp-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

const buildUserPayload = () => ({
  username: ADMIN_USERNAME,
  name: ADMIN_DISPLAY_NAME,
  role: 'Administrator',
  email: ADMIN_EMAIL,
});

export const login = (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const userPayload = buildUserPayload();
  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return res.json({
    success: true,
    data: {
      token,
      user: userPayload,
    },
    message: `Welcome back, ${ADMIN_DISPLAY_NAME}!`,
  });
};

export const getProfile = (req, res) => {
  return res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
};

