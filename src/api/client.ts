const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
): Promise<T> {
    const headers: Record<string, string> = {};
    if (body) headers["Content-Type"] = "application/json";

    const token = sessionStorage.getItem("access_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        if (res.status === 401) {
            sessionStorage.removeItem("access_token");
            window.location.hash = "#login";
            throw new Error("Session expired. Please log in again.");
        }
        const text = await res.text();
        let errorMessage = `Request failed (${res.status})`;
        try {
            const json = JSON.parse(text);
            if (json && typeof json.message === "string") {
                errorMessage = json.message;
            } else if (
                json &&
                Array.isArray(json.message) &&
                json.message.length > 0
            ) {
                errorMessage = json.message[0];
            }
        } catch {
            // response wasn't JSON, use default message
        }
        throw new Error(errorMessage);
    }
    return res.json();
}

export const api = {
    get: <T>(path: string) => request<T>("GET", path),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
    del: <T>(path: string) => request<T>("DELETE", path),
};
