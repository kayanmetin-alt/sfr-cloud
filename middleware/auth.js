import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sfr-cloud-secret-change-in-production';

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Oturum gerekli.' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.email = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Oturum süresi doldu. Tekrar giriş yapın.' });
  }
}

export function signToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function signTempToken(userId, email) {
  return jwt.sign(
    { userId, email, needs2fa: true },
    JWT_SECRET,
    { expiresIn: '5m' }
  );
}

export function verifyTempToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload.needs2fa || !payload.userId) return null;
    return payload;
  } catch {
    return null;
  }
}
