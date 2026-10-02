import {post, request} from '../api/client';

export async function logout(token) {
  await request('/profile/logout', {method: 'POST', token});
}

export async function login({identifier, method, password}) {
  const data = await post('/auth/login', {...identityPayload(identifier, method), password});
  return sessionFromResponse(data);
}

function sessionFromResponse(data) {
  if (!data?.token || !data.user?.id ||
      !['admin', 'customer'].includes(data.user.role)) {
    throw new Error('The server returned an invalid login response.');
  }
  return {
    token: data.token,
    expiresAt: Date.now() + (Number.isFinite(data.expiresIn) && data.expiresIn > 0 ? data.expiresIn : 3600) * 1000,
    user: {...data.user, name: data.user.fullName, phone: data.user.mobile},
  };
}
export async function register({name, identifier, method, password, confirmPassword}) {
  const data = await post('/auth/register', {
    fullName: name.trim(), ...identityPayload(identifier, method), password, confirmPassword,
  });
  return sessionFromResponse(data);
}
function identityPayload(identifier, method) {
  if (!['email', 'mobile'].includes(method) || typeof identifier !== 'string') {
    throw new Error('Select email or mobile and enter your account details.');
  }
  return method === 'mobile' ? {mobile: identifier.trim()} : {email: identifier.trim().toLowerCase()};
}
