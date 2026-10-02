const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('[database] MongoDB connected');
}
async function disconnectDatabase() { await mongoose.disconnect(); }
mongoose.connection.on('error', () => console.error('[database] Connection error'));
mongoose.connection.on('disconnected', () => console.warn('[database] MongoDB disconnected'));
module.exports = { connectDatabase, disconnectDatabase };
