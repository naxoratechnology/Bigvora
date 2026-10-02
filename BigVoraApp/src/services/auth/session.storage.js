import * as Keychain from 'react-native-keychain';

const options = {service: 'com.bigvora.auth.session'};
export async function saveSession(session) {
  const saved = await Keychain.setGenericPassword('session', JSON.stringify(session), options);
  if (!saved) throw new Error('Unable to save your login securely. Please try again.');
}
export async function clearSession() {
  await Keychain.resetGenericPassword(options);
}
export async function readSession() {
  const stored = await Keychain.getGenericPassword(options);
  if (!stored) return null;
  let session;
  try { session = JSON.parse(stored.password); }
  catch { await clearSession(); return null; }
  if (typeof session?.token !== 'string' || !session.token ||
      typeof session.user?.id !== 'string' || typeof session.user?.name !== 'string' ||
      !['admin', 'customer'].includes(session.user.role) ||
      !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
    await clearSession();
    return null;
  }
  return session;
}
