
const API_URL = import.meta.env.VITE_API_URL;

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

  const response = await fetch(`${API_URL}${endpoint}`, {
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

  return response.json();
}
