const { login, register } = require('./auth.service');

async function loginController(req, res, next) {
  res.set('Cache-Control', 'no-store');
  try {
    const result = await login(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
}

async function registerController(req, res, next) {
  res.set('Cache-Control', 'no-store');
  try {
    const result = await register(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) { return next(error); }
}
async function logoutController(req, res, next) {
  try {
    const RevokedToken = require('./revoked-token.model');
    await RevokedToken.init();
    await RevokedToken.updateOne(
      { tokenHash: req.authSession.tokenHash },
      { $setOnInsert: { expiresAt: req.authSession.expiresAt } },
      { upsert: true },
    );
    return res.json({ success: true, message: 'Logged out successfully.', data: {} });
  } catch (error) { return next(error); }
}
module.exports = { loginController, registerController, logoutController };
