import { request } from '../lib/apiClient.js';

/** api-docs.json 의 paths 를 그대로 매핑합니다. */

export const authApi = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/admin/auth/register', { method: 'POST', body })
};

export const regionsApi = {
  list: () => request('/admin/regions'),
  create: (body) => request('/admin/regions', { method: 'POST', body }),
  update: (id, body) => request(`/admin/regions/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/admin/regions/${id}`, { method: 'DELETE' })
};

export const placesApi = {
  list: (regionId) => request(`/admin/places${regionId ? `?region_id=${regionId}` : ''}`),
  detail: (id) => request(`/admin/places/${id}`),
  create: (body) => request('/admin/places', { method: 'POST', body }),
  update: (id, body) => request(`/admin/places/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/admin/places/${id}`, { method: 'DELETE' }),
  qrcode: (id) => request(`/admin/places/${id}/qrcode`, { blob: true })
};

export const coursesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.type) qs.set('type', params.type);
    if (params.status) qs.set('status', params.status);
    const s = qs.toString();
    return request(`/admin/courses${s ? `?${s}` : ''}`);
  },
  pending: (type) => request(`/admin/courses/pending${type ? `?type=${type}` : ''}`),
  detail: (id) => request(`/admin/courses/${id}`),
  stats: (id) => request(`/admin/courses/${id}/stats`),
  create: (body) => request('/admin/courses', { method: 'POST', body }),
  update: (id, body) => request(`/admin/courses/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/admin/courses/${id}`, { method: 'DELETE' }),
  replacePlaces: (id, body) => request(`/admin/courses/${id}/places`, { method: 'PUT', body }),
  approve: (id, body) => request(`/admin/courses/${id}/approve`, { method: 'POST', body }),
  reject: (id, body) => request(`/admin/courses/${id}/reject`, { method: 'POST', body })
};

export const rewardsApi = {
  list: () => request('/admin/rewards'),
  create: (body) => request('/admin/rewards', { method: 'POST', body }),
  update: (id, body) => request(`/admin/rewards/${id}`, { method: 'PUT', body }),
  remove: (id) => request(`/admin/rewards/${id}`, { method: 'DELETE' })
};
