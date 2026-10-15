import {post, request} from '../api/client';

export async function logout(token) {
  await request('/profile/logout', {method: 'POST', token});
}

export async function login({identifier, password, otp}) {
  const data = await post('/auth/login', {...identityPayload(identifier), password, otp});
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
export async function register({name, identifier, password, confirmPassword, otp}) {
  const data = await post('/auth/register', {
    fullName: name.trim(), ...identityPayload(identifier), password, confirmPassword, otp,
  });
  return sessionFromResponse(data);
}
export async function requestOtp(mobile,purpose){return post('/auth/otp/request',{mobile:mobile.trim(),purpose});}
function identityPayload(identifier) { if(typeof identifier!=='string'||!/^\d{10}$/.test(identifier.trim()))throw new Error('Enter a valid 10-digit mobile number.');return {mobile:identifier.trim()}; }
