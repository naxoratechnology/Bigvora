const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { createHash } = require('node:crypto');

async function requireAdmin(req, res, next) {
  res.set('Cache-Control', 'no-store');
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    return res.status(503).json({ success: false, message: 'Authentication is not configured.' });
  }
  const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') || '');
  if (!match) return res.status(401).json({ success: false, message: 'Please sign in again.' });
  let claims;
  try {
    claims = jwt.verify(match[1], secret, {
      algorithms: ['HS256'], issuer: 'bigvoraapi', audience: 'bigvora-app',
    });
  } catch {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }
  if (!mongoose.isObjectIdOrHexString(claims.sub)) {
    return res.status(401).json({ success: false, message: 'Invalid session.' });
  }
  try {
    const tokenHash = createHash('sha256').update(match[1]).digest('hex');
    const RevokedToken = require('../modules/auth/revoked-token.model');
    if (await RevokedToken.exists({ tokenHash })) {
      return res.status(401).json({ success: false, message: 'You have logged out. Please sign in again.' });
    }
    const User = require('../modules/auth/user.model');
    const user = await User.findById(claims.sub).select('role isActive');
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Please sign in again.' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required.' });
    req.adminId = user._id;
    req.authSession = { tokenHash, expiresAt: new Date(claims.exp * 1000) };
    return next();
  } catch (error) { return next(error); }
}
module.exports = { requireAdmin };
