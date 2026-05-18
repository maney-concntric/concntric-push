const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  me: () => request('/auth/me'),
  getInvite: (token) => request(`/auth/invite/${token}`),
  acceptInvite: (token, password) => request(`/auth/invite/${token}/accept`, { method: 'POST', body: { password } }),

  // Users
  getUsers: () => request('/users'),
  getStats: () => request('/users/stats'),
  inviteUser: (name, email, role) => request('/users/invite', { method: 'POST', body: { name, email, role } }),
  editUserRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  deactivateUser: (id) => request(`/users/${id}/deactivate`, { method: 'PATCH' }),
  reactivateUser: (id) => request(`/users/${id}/reactivate`, { method: 'PATCH' }),
  getUserMeetings: (id) => request(`/users/${id}/meetings`),
  assignMeeting: (userId, meetingId) => request(`/users/${userId}/meetings/${meetingId}`, { method: 'POST' }),
  unassignMeeting: (userId, meetingId) => request(`/users/${userId}/meetings/${meetingId}`, { method: 'DELETE' }),

  // Team
  getTeam: () => request('/team'),
  addTeamMember: (name, role) => request('/team', { method: 'POST', body: { name, role } }),
  updateTeamMember: (id, data) => request(`/team/${id}`, { method: 'PATCH', body: data }),
  removeTeamMember: (id) => request(`/team/${id}`, { method: 'DELETE' }),

  // Meetings
  getMeetings: () => request('/meetings'),
  createMeeting: (facilitator) => request('/meetings', { method: 'POST', body: { facilitator } }),
  getMeeting: (id) => request(`/meetings/${id}`),
  updateFacilitator: (id, facilitator) => request(`/meetings/${id}`, { method: 'PATCH', body: { facilitator } }),
  saveSection: (meetingId, key, data) => request(`/meetings/${meetingId}/sections/${key}`, { method: 'PUT', body: data }),
  completeMeeting: (id) => request(`/meetings/${id}/complete`, { method: 'PATCH' }),
  deleteMeeting: (id) => request(`/meetings/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  saveSettings: (data) => request('/settings', { method: 'PUT', body: data }),
};
