import { getConfig } from "./config.js"

export async function apiRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const config = getConfig()
  const url = `${config.apiUrl}${path}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (config.token) {
    headers["Authorization"] = `Bearer ${config.token}`
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await apiRequest(path)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const res = await apiRequest(path, {
    method: "POST",
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `API error: ${res.status}`)
  }
  return res.json()
}
