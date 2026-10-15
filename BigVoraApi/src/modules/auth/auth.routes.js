const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const { loginController, registerController, logoutController, requestOtpController, resetPasswordController } = require('./auth.controller');
const { requireAdmin } = require('../../middleware/admin.middleware');

router.post('/login', loginController);
router.post('/otp/request', requestOtpController);
router.post('/password/reset', resetPasswordController);

router.post('/register', rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many registration attempts. Try again in one hour.' },
}), registerController);
module.exports = router;
router.post('/logout', requireAdmin, logoutController);
