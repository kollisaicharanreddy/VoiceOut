const API_ROOT = '/api';

function authHeader(auth) {
  if (!auth?.username || !auth?.password) {
    return {};
  }

  return {
    Authorization: `Basic ${btoa(`${auth.username}:${auth.password}`)}`
  };
}

async function request(path, options = {}) {
  const { headers, ...rest } = options;
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {})
    },
    ...rest
  });

  if (!response.ok) {
    const message = await response.text();
    const err = new Error(message || `Request failed with status ${response.status}`);
    // attach status for callers to check
    err.status = response.status;
    throw err;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function createComplaint(content) {
  return request('/complaints', {
    method: 'POST',
    body: JSON.stringify({ content })
  });
}

export function adminLogin(username, password) {
  return fetch(`${API_ROOT}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(text || `Login failed with status ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return null;
  });
}

export function getComplaint(trackingCode) {
  return request(`/complaints/${encodeURIComponent(trackingCode)}`);
}

export function listComplaints(auth, status) {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`/admin/complaints${suffix}`, {
    headers: authHeader(auth),
    credentials: 'include'
  });
}

export function getComplaintDetail(auth, complaintId) {
  return request(`/admin/complaints/${complaintId}`, {
    headers: authHeader(auth),
    credentials: 'include'
  });
}

export function updateComplaintStatus(auth, complaintId, status) {
  return request(`/admin/complaints/${complaintId}/status`, {
    method: 'PATCH',
    headers: authHeader(auth),
    credentials: 'include',
    body: JSON.stringify({ status })
  });
}

export function addComplaintNote(auth, complaintId, note) {
  return request(`/admin/complaints/${complaintId}/notes`, {
    method: 'POST',
    headers: authHeader(auth),
    credentials: 'include',
    body: JSON.stringify({ note })
  });
}

export function getSimilarComplaints(auth, complaintId, limit = 5) {
  return request(`/admin/complaints/${complaintId}/similar?n=${limit}`, {
    headers: authHeader(auth),
    credentials: 'include'
  });
}
