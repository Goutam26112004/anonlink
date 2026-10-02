import jwt, { SignOptions } from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'supersecretkey123') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set in production!');
    }
    return 'dev-secret-key-change-me';
  }
  return secret;
};

export const generateToken = (payload: object, expiresIn: SignOptions['expiresIn'] = '15m') => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, getJwtSecret());
};
