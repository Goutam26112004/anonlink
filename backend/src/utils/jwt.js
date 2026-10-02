import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';
export const generateToken = (payload, expiresIn = '15m') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
