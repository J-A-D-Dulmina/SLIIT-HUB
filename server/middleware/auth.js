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
    console.log('No token found in request');
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('=== AUTH DEBUG ===');
    console.log('Decoded token:', decoded);
    console.log('User type:', decoded.type);
    console.log('Student ID:', decoded.studentId);
    console.log('Authentication successful for user:', decoded);
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    console.log('Token:', token);
    return res.status(403).json({ message: 'Invalid token' });
  }
}

module.exports = authenticateToken; 