const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `API error ${res.status}: ${text}`;
    try {
      const json = JSON.parse(text);
      if (json && typeof json.message === 'string') {
        errorMessage = json.message;
      } else if (json && Array.isArray(json.message) && json.message.length > 0) {
        errorMessage = json.message[0]; // NestJS validation errors can be an array
      }
    } catch {
      // Ignore JSON parse errors and use the default message
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
