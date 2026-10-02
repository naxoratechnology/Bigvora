const bcrypt = require('bcryptjs');
const loadEnvironment = require('../config/environment');
const { connectDatabase, disconnectDatabase } = require('../config/database');

function readAdminCredentials() {
  const fullName = (process.env.ADMIN_NAME || 'Big Vora Admin').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!fullName || fullName.length > 100) throw new Error('ADMIN_NAME must contain 1 to 100 characters.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Set a valid ADMIN_EMAIL in .env.');
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must contain at least 12 characters and no more than 72 UTF-8 bytes.');
  }
  return { fullName, email, password };
}

async function seedAdmin(credentials, model) {
  await model.init(); // Ensure the unique email index exists before inserting.
  const existing = await model.findOne({ email: credentials.email });
  if (existing) {
    if (existing.role !== 'admin') throw new Error('This email belongs to a non-admin user; seeding will not promote it.');
    return 'Admin already exists; no account fields or password changed.';
  }
  const password = await bcrypt.hash(credentials.password, 12);
  try {
    await model.create({ ...credentials, password, role: 'admin', isActive: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const concurrent = await model.findOne({ email: credentials.email });
    if (concurrent?.role !== 'admin') throw new Error('Email conflict; no existing account was modified.');
    return 'Admin already exists; no account fields or password changed.';
  }
  return 'Admin account created successfully.';
}

async function main() {
  let credentials;
  let environment;
  try {
    environment = loadEnvironment();
    credentials = readAdminCredentials();
  } catch (error) {
    console.error(`[seed:admin] ${error.message}`);
    process.exitCode = 1;
    return;
  }
  try {
    await connectDatabase(environment.mongoUri);
    const User = require('../modules/auth/user.model');
    console.log(`[seed:admin] ${await seedAdmin(credentials, User)}`);
  } catch {
    // MongoDB errors may expose secrets. Do not print credentials or raw errors.
    console.error('[seed:admin] Failed. Check MongoDB connectivity and ensure the email is not owned by a customer.');
    process.exitCode = 1;
  } finally {
    try { await disconnectDatabase(); }
    catch { console.error('[seed:admin] Database disconnect failed'); process.exitCode = 1; }
  }
}

if (require.main === module) void main();
module.exports = { readAdminCredentials, seedAdmin };
