const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

function authenticateToken(req, res, next) {
  // Try to get token from Authorization header first
  let token = req.headers.authorization;
  
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7); // Remove 'Bearer ' prefix
  } else {
    // Fallback to cookie token
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

module.exports = authenticateToken; 