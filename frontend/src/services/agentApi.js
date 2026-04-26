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
    let message = `Request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      if (errorBody?.detail) {
        message = typeof errorBody.detail === 'string' ? errorBody.detail : JSON.stringify(errorBody.detail)
      }
    } catch {
      // Keep fallback message when response body isn't JSON.
    }
    throw new Error(message)
  }

  return response.json()
}

export function listAgentTasks() {
  return request('/api/agent/tasks')
}

export function getAgentTask(taskId) {
  return request(`/api/agent/tasks/${taskId}`)
}

export function createAgentChat(payload) {
  return request('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createAgentResponse(payload) {
  return request('/api/agent/respond', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createAgentTask(payload) {
  return request('/api/agent/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateAgentTask(taskId, payload) {
  return request(`/api/agent/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function removeAgentTask(taskId) {
  return request(`/api/agent/tasks/${taskId}`, { method: 'DELETE' })
}

// ── Feasibility Checker API ──

export function checkProjectFeasibility(projectId) {
  return request(`/api/projects/${projectId}/feasibility`)
}

export function listProjects() {
  return request('/api/projects')
}

export function getProject(projectId) {
  return request(`/api/projects/${projectId}`)
}
