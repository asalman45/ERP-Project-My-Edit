import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'empclerp-secret';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ success: false, message: 'Authorization header missing.' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Invalid authorization header format.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
