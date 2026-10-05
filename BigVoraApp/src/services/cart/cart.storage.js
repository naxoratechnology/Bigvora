import * as Keychain from 'react-native-keychain';

const serviceFor = userId => `com.bigvora.cart.${userId}`;

export async function readCachedCart(userId) {
  if (!userId) return [];
  const stored = await Keychain.getGenericPassword({service: serviceFor(userId)});
  if (!stored) return [];
  try {
    const items = JSON.parse(stored.password);
    return Array.isArray(items) ? items : [];
  } catch {
    await Keychain.resetGenericPassword({service: serviceFor(userId)});
    return [];
  }
}

export async function saveCachedCart(userId, items) {
  if (!userId) return;
  await Keychain.setGenericPassword('cart', JSON.stringify(items), {
    service: serviceFor(userId),
  });
}
