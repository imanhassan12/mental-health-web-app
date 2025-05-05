const jwt = require('jsonwebtoken');

const isProd = process.env.NODE_ENV === 'production';

module.exports = function auth(req, res, next) {
  if (isProd) {
    // Trust ALB / Cognito headers in production
    const cognitoSub = req.headers['x-amzn-oidc-identity'];
    if (!cognitoSub) return res.sendStatus(401);
    req.user = { sub: cognitoSub };
    return next();
  }

  // Development: validate JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = decoded;
    next();
  } catch {
    return res.sendStatus(401);
  }
}; 