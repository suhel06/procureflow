
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://procureflow-api-gi9r.onrender.com";

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
