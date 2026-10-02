const loadEnvironment = require('./src/config/environment');
const { connectDatabase, disconnectDatabase } = require('./src/config/database');
let server;
let shuttingDown = false;
async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  try {
    if (server?.listening) {
      server.closeIdleConnections();
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
    await disconnectDatabase();
    clearTimeout(deadline);
    process.exitCode = exitCode;
  } catch { console.error('[server] Shutdown failed'); process.exit(1); }
}
async function startServer() {
  let environment;
  try { environment = loadEnvironment(); }
  catch (error) { console.error(`[server] ${error.message}`); process.exitCode = 1; return; }
  try {
    await connectDatabase(environment.mongoUri);
    if (shuttingDown) { await disconnectDatabase(); return; }
    const app = require('./src/app');
    server = app.listen(environment.port, '0.0.0.0');
    server.on('listening', () => console.log(`[server] Big Vora API listening on port ${environment.port}`));
    server.on('error', () => { console.error('[server] HTTP server failed; check PORT availability'); void shutdown(1); });
  } catch {
    // Do not log driver errors, which can contain credentials.
    console.error('[server] MongoDB connection failed. Check MONGODB_URI, credentials, and database network access.');
    await shutdown(1);
  }
}
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
void startServer();
