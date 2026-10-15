const { login, register } = require('./auth.service');
const {sendOtp,verifyOtp}=require('./otp.service');

async function loginController(req, res, next) {
  res.set('Cache-Control', 'no-store');
  try {
    await verifyOtp(req.body?.mobile,'login',req.body?.otp);
    const result = await login(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    return next(error);
  }
}

async function registerController(req, res, next) {
  res.set('Cache-Control', 'no-store');
  try {
    await verifyOtp(req.body?.mobile,'register',req.body?.otp);
    const result = await register(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) { return next(error); }
}
async function requestOtpController(req,res,next){res.set('Cache-Control','no-store');try{await sendOtp(req.body?.mobile,req.body?.purpose);return res.json({success:true,data:{message:'OTP sent successfully.'}});}catch(error){return next(error);}}
async function resetPasswordController(req,res,next){try{const {mobile,otp,password,confirmPassword}=req.body||{};await verifyOtp(mobile,'reset',otp);if(typeof password!=='string'||password.length<8||password!==confirmPassword)return res.status(400).json({success:false,message:'Enter matching passwords of at least 8 characters.'});const bcrypt=require('bcryptjs');const User=require('./user.model');const user=await User.findOne({mobile:mobile?.trim(),isActive:true});if(!user)return res.status(404).json({success:false,message:'Account not found.'});user.password=await bcrypt.hash(password,12);await user.save();return res.json({success:true,data:{}});}catch(error){return next(error);}}
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
module.exports = { loginController, registerController, logoutController, requestOtpController, resetPasswordController };
