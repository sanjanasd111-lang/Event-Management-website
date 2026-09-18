import jwt from 'jsonwebtoken';
import { findUserById } from '../utils/mysql.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretcodeskyjwtkey2026');

      const user = await findUserById(decoded.id);
      if (user) {
        req.user = { _id: user._id, role: user.role, name: user.name, email: user.email, status: user.status };
        next();
      } else {
        res.status(401).json({ message: 'Not authorized, user deleted' });
      }
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};
