const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Used for unknown emails too, so both failure paths perform a password check.
const dummyHash = bcrypt.hashSync('not-a-real-account-password', 12);

function readIdentity(body) {
  if (!body || (body.email !== undefined && body.mobile !== undefined)) return null;
  if (body.mobile !== undefined) {
    if (typeof body.mobile !== 'string' || !/^\d{10}$/.test(body.mobile.trim())) return null;
    return { mobile: body.mobile.trim() };
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  return /^\S+@\S+\.\S+$/.test(email) && email.length <= 254 ? { email } : null;
}

async function findUser(identity) {
  // Load only after the server has connected to MongoDB.
  const User = require('./user.model');
  return User.findOne(identity).select('+password');
}

async function login(body, lookup = findUser) {
  const identity = readIdentity(body);
  const password = body?.password;
  if (!identity ||
      typeof password !== 'string' || !password.length || Buffer.byteLength(password, 'utf8') > 72) {
    return { status: 400, body: { success: false, message: 'Provide a valid email or 10-digit mobile number and password.' } };
  }
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    return { status: 503, body: { success: false, message: 'Login is not configured. Contact the administrator.' } };
  }
  const user = await lookup(identity);
  const matches = await bcrypt.compare(password, user?.password || dummyHash);
  if (!user || !matches || user.isActive !== true || !['admin', 'customer'].includes(user.role)) {
    return { status: 401, body: { success: false, message: 'Invalid email/mobile or password.' } };
  }
  return sessionResponse(user, secret);

}

function sessionResponse(user, secret, status = 200) {
  const configuredExpiry = String(process.env.JWT_EXPIRES_IN || '30d').trim();
  const expiresIn = /^\d+(?:ms|s|m|h|d|w|y)?$/i.test(configuredExpiry)
    ? configuredExpiry
    : '30d';
  let token;
  try {
    token = jwt.sign({ role: user.role }, secret, {
      algorithm: 'HS256', subject: String(user._id), expiresIn,
      issuer: 'bigvoraapi', audience: 'bigvora-app',
    });
  } catch {
    return {
      status: 503,
      body: {
        success: false,
        message: 'Login is temporarily unavailable. Contact the administrator.',
      },
    };
  }
  return { status, body: {
    success: true,
    message: status === 201 ? 'Account created successfully.' : 'Login successful.',
    data: {
      token, tokenType: 'Bearer', expiresIn: jwt.decode(token).exp - Math.floor(Date.now() / 1000),
      user: { id: String(user._id), fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role },
      layout: user.role === 'admin' ? 'admin' : 'user',
    },
  } };
}

async function register(body, suppliedModel) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['fullName', 'email', 'mobile', 'password', 'confirmPassword'].includes(key))) {
    return { status: 400, body: { success: false, message: 'Provide full name, email or mobile, password and confirm password only.' } };
  }
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const identity = readIdentity(body);
  const password = body.password;
  if (fullName.length < 2 || fullName.length > 100) {
    return { status: 400, body: { success: false, message: 'Full name must contain 2 to 100 characters.' } };
  }
  if (!identity) {
    return { status: 400, body: { success: false, message: 'Provide exactly one valid email or 10-digit mobile number.' } };
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return { status: 400, body: { success: false, message: 'Password must contain at least 8 characters and no more than 72 UTF-8 bytes.' } };
  }
  if (password !== body.confirmPassword) {
    return { status: 400, body: { success: false, message: 'Passwords do not match.' } };
  }
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    return { status: 503, body: { success: false, message: 'Registration is not configured. Contact the administrator.' } };
  }
  const User = suppliedModel || require('./user.model');
  await User.init();
  if (await User.exists(identity)) {
    return { status: 409, body: { success: false, message: 'An account with this email/mobile already exists. Please sign in.' } };
  }
  const hash = await bcrypt.hash(password, 12);
  let user;
  try {
    user = await User.create({ fullName, ...identity, password: hash, role: 'customer', isActive: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    return { status: 409, body: { success: false, message: 'An account with this email/mobile already exists. Please sign in.' } };
  }
  return sessionResponse(user, secret, 201);
}
module.exports = { login, register };
