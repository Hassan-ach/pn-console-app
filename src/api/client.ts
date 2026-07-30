const BASE_URL: string =
    (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3000/api';

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
): Promise<T> {
    const headers: Record<string, string> = {};
    if (body) headers['Content-Type'] = 'application/json';

    const token = sessionStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        if (res.status === 401 && token) {
            sessionStorage.removeItem('access_token');
            window.location.hash = '#/login';
            throw new Error('Session expired. Please log in again.');
        }
        const text = await res.text();
        let errorMessage = `Request failed (${res.status})`;
        try {
            const json: unknown = JSON.parse(text);
            if (
                json &&
                typeof json === 'object' &&
                'message' in json &&
                typeof json.message === 'string'
            ) {
                errorMessage = json.message;
            } else if (
                json &&
                typeof json === 'object' &&
                'message' in json &&
                Array.isArray(json.message) &&
                json.message.length > 0
            ) {
                errorMessage = json.message[0] as string;
            }
        } catch {
            // response wasn't JSON, use default message
        }
        throw new Error(errorMessage);
    }
    return (await res.json()) as T;
}

async function requestStream(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal,
): Promise<Response> {
    const headers: Record<string, string> = {};
    if (body) headers['Content-Type'] = 'application/json';

    const token = sessionStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
    });

    if (!res.ok) {
        if (res.status === 401 && token) {
            sessionStorage.removeItem('access_token');
            window.location.hash = '#/login';
            throw new Error('Session expired. Please log in again.');
        }
        const text = await res.text();
        let errorMessage = `Request failed (${res.status})`;
        try {
            const json: unknown = JSON.parse(text);
            if (
                json &&
                typeof json === 'object' &&
                'message' in json &&
                typeof json.message === 'string'
            ) {
                errorMessage = json.message;
            }
        } catch {
            // response wasn't JSON, use default message
        }
        throw new Error(errorMessage);
    }

    return res;
}

export const api = {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    del: <T>(path: string) => request<T>('DELETE', path),
    stream: (path: string, body?: unknown, signal?: AbortSignal) =>
        requestStream('POST', path, body, signal),
};
