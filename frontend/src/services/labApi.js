const defaultApiFromWs = process.env.NEXT_PUBLIC_WS_URL
  ? process.env.NEXT_PUBLIC_WS_URL.replace(/^ws/i, 'http')
  : 'http://localhost:8000'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || defaultApiFromWs).replace(/\/$/, '')

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      // keep default
    }
    throw new Error(detail)
  }
  if (response.status === 204) return null
  return response.json()
}

export const projectsApi = {
  list: () => request('/api/projects'),
  create: (payload) => request('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),
  get: (id) => request(`/api/projects/${id}`),
  update: (id, payload) => request(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/projects/${id}`, { method: 'DELETE' }),
  listRequirements: (id) => request(`/api/projects/${id}/requirements`),
  addRequirement: (id, payload) => request(`/api/projects/${id}/requirements`, { method: 'POST', body: JSON.stringify(payload) }),
  getRequirement: (projectId, reqId) => request(`/api/projects/${projectId}/requirements/${reqId}`),
  updateRequirement: (projectId, reqId, payload) =>
    request(`/api/projects/${projectId}/requirements/${reqId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteRequirement: (projectId, reqId) => request(`/api/projects/${projectId}/requirements/${reqId}`, { method: 'DELETE' }),
}

export const inventoryApi = {
  list: () => request('/api/inventory'),
  create: (payload) => request('/api/inventory', { method: 'POST', body: JSON.stringify(payload) }),
  get: (id) => request(`/api/inventory/${id}`),
  update: (id, payload) => request(`/api/inventory/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/inventory/${id}`, { method: 'DELETE' }),
}

export const experimentsApi = {
  list: () => request('/api/experiments'),
  create: (payload) => request('/api/experiments', { method: 'POST', body: JSON.stringify(payload) }),
  get: (id) => request(`/api/experiments/${id}`),
  listByProject: (projectId) => request(`/api/experiments/project/${projectId}`),
  update: (id, payload) => request(`/api/experiments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/experiments/${id}`, { method: 'DELETE' }),
}

export const notificationsApi = {
  list: () => request('/api/notifications'),
  create: (payload) => request('/api/notifications', { method: 'POST', body: JSON.stringify(payload) }),
  markRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
}

