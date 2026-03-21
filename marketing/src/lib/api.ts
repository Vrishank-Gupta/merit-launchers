const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("cms_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}/v1/cms${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image: string | null;
  author: string;
  category: string;
  tags: string[];
  meta_description: string | null;
  status: "draft" | "published";
  publish_date: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}
