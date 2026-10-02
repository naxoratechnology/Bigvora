const mongoose = require('mongoose');
const loadEnvironment = require('../config/environment');

async function main() {
  try {
    await mongoose.connect(loadEnvironment().mongoUri, {autoIndex: false, serverSelectionTimeoutMS: 10000});
    const collection = mongoose.connection.db.collection('users');
    // Build the replacement unique index before removing the legacy non-sparse index.
    await collection.createIndex({email: 1}, {unique: true, sparse: true, name: 'email_identifier_unique'});
    await collection.createIndex({mobile: 1}, {unique: true, sparse: true, name: 'mobile_identifier_unique'});
    const indexes = await collection.indexes();
    for (const index of indexes) {
      if (Object.keys(index.key).length === 1 && index.key.email === 1 &&
          index.unique && !index.sparse && !index.partialFilterExpression &&
          index.name !== 'email_identifier_unique') {
        await collection.dropIndex(index.name);
      }
    }
    console.log('[auth:indexes] Unique email/mobile indexes ready. Account records unchanged.');
  } catch (error) {
    console.error('[auth:indexes] Failed:', error.codeName || error.name);
    process.exitCode = 1;
  } finally { await mongoose.disconnect(); }
}
if (require.main === module) void main();
