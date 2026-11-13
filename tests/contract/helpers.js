export const API_ORIGIN = process.env.TEST_API_ORIGIN || 'http://127.0.0.1:4173';

export async function requestJson(path, options = {}) {
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    headers: { Accept: 'application/json', ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

export function assertError(body, code) {
  if (body?.error?.code !== code) {
    throw new Error(`Expected error code ${code}, received ${JSON.stringify(body)}`);
  }
}
