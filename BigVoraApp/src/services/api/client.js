import {API_BASE_URL, API_TIMEOUT_MS} from '../../config/api';

export async function request(path, {method = 'GET', body, token} = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json', Accept: 'application/json',
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      throw new Error(error.name === 'AbortError'
        ? 'The request timed out. Please try again.'
        : 'Unable to connect. Check your connection and try again.');
    }
    let result;
    try { result = await response.json(); }
    catch { throw new Error('The server returned an invalid response. Please try again.'); }
    if (!response.ok || result?.success !== true) {
      const error = new Error(result?.message || 'The request failed. Please try again.');
      error.status = response.status;
      throw error;
    }
    return result.data;
  } finally {
    clearTimeout(timeout);
  }
}

export const post = (path, body) => request(path, {method: 'POST', body});
