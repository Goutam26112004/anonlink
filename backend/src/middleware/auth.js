import { verifyToken } from '../utils/jwt.js';
export const authGuard = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Access token missing' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = verifyToken(token);
        req.user = {
            userId: decoded.userId,
            email: decoded.email || null,
            registrationType: decoded.registrationType || 'email',
            isRegistered: decoded.registrationType !== 'guest',
            reputationScore: decoded.reputationScore ?? 100,
            level: decoded.level ?? 1
        };
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};
