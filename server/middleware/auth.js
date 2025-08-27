const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

function authenticateToken(req, res, next) {
  console.log('=== Auth Middleware Debug ===');
  console.log('Headers:', req.headers);
  console.log('Cookies:', req.cookies);
  
  // Try to get token from Authorization header first
  let token = req.headers.authorization;
  
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7); // Remove 'Bearer ' prefix
    console.log('Token from Authorization header:', token ? 'Present' : 'Not found');
  } else {
    // Fallback to cookie token
    token = req.cookies.token;
    console.log('Token from cookie:', token ? 'Present' : 'Not found');
  }
  
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token decoded successfully:', { 
      id: decoded.id, 
      type: decoded.type,
      studentId: decoded.studentId,
      lecturerId: decoded.lecturerId
    });
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
}

module.exports = authenticateToken; 
module.exports.authenticateAdmin = function(req, res, next) {
  authenticateToken(req, res, function() {
    if (req.user && req.user.type === 'admin') return next();
    return res.status(403).json({ message: 'Admin access required' });
  });
};