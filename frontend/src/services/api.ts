
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

function buildApiUrl(endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  return `${API_URL}${normalizedEndpoint}`;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit,
  rawResponse?: false
): Promise<T>;
export async function apiFetch(
  endpoint: string,
  options: RequestInit,
  rawResponse: true
): Promise<Response>;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  rawResponse = false
) {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Something went wrong.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep the default message if the response is not JSON.
    }

    throw new Error(message);
  }

  if (rawResponse) {
    return response;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
