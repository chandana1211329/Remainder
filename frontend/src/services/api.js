let rawUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;
if (rawUrl.endsWith('/')) {
  rawUrl = rawUrl.slice(0, -1);
}
if (!rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl}/api`;
}
const BASE_URL = rawUrl;

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong.');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  auth: {
    login: (username, password) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    register: (username, password) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
    getMe: () => request('/auth/me')
  },
  dashboard: {
    get: () => request('/dashboard')
  },
  jsroadmap: {
    get: () => request('/jsroadmap'),
    complete: (topicId, confidenceRating) => request('/jsroadmap/complete', {
      method: 'POST',
      body: JSON.stringify({ topicId, status: 'completed', confidenceRating })
    }),
    getRevisions: () => request('/jsroadmap/revisions'),
    completeRevision: (revisionId) => request('/jsroadmap/revisions/complete', {
      method: 'POST',
      body: JSON.stringify({ revisionId })
    })
  },
  dsa: {
    get: () => request('/dsa'),
    update: (dsaTopicId, data) => request('/dsa/update', {
      method: 'POST',
      body: JSON.stringify({ dsaTopicId, ...data })
    })
  },
  assignments: {
    get: () => request('/assignments'),
    complete: (assignmentId, data) => request('/assignments/update', {
      method: 'POST',
      body: JSON.stringify({ assignmentId, status: 'completed', ...data })
    })
  },
  daily: {
    get: (date) => request(`/daily?date=${date}`),
    update: (data) => request('/daily/update', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  calendar: {
    get: (year, month) => request(`/calendar?year=${year}&month=${month}`)
  },
  notes: {
    save: (type, id, notes) => request('/notes/save', {
      method: 'POST',
      body: JSON.stringify({ type, id, notes })
    }),
    search: (query) => request(`/notes/search?query=${query}`)
  },
  settings: {
    get: () => request('/settings'),
    update: (data) => request('/settings/update', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  admin: {
    reset: () => request('/admin/reset', { method: 'POST' }),
    backup: () => request('/admin/backup'),
    restore: (backup) => request('/admin/restore', {
      method: 'POST',
      body: JSON.stringify({ backup })
    }),
    importJS: (topics) => request('/admin/import/js', {
      method: 'POST',
      body: JSON.stringify({ topics })
    }),
    importDSA: (dsaTopics) => request('/admin/import/dsa', {
      method: 'POST',
      body: JSON.stringify({ dsaTopics })
    }),
    importAssignments: (assignments) => request('/admin/import/assignments', {
      method: 'POST',
      body: JSON.stringify({ assignments })
    })
  }
};
