import axios from 'axios';

// Prefer env var; fallback to localhost
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;

// Helper builders for common modules
export const resourcesApi = {
  listAll: () => api.get('/api/resources'),
  listPublic: () => api.get('/api/resources/public'),
  listMine: () => api.get('/api/resources/mine'),
  upload: (formData) => api.post('/api/resources/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  downloadUrl: (id) => `${baseURL}/api/resources/download/${id}`,
  updateVisibility: (id, visibility) => api.patch(`/api/resources/${id}/visibility`, { visibility }),
  update: (id, body) => api.patch(`/api/resources/${id}`, body),
  delete: (id) => api.delete(`/api/resources/${id}`),
};

export const userApi = {
  me: () => api.get('/api/protected'),
  listLecturers: () => api.get('/api/lecturers'),
};

export const tutoringApi = {
  myVideos: () => api.get('/api/tutoring/videos'),
  upload: (formData) => api.post('/api/tutoring/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/api/tutoring/videos/${id}`),
  publishToggle: (id, status) => api.patch(`/api/tutoring/videos/${id}/publish`, { status }),
  requestReview: (id, lecturerId) => api.post(`/api/tutoring/videos/${id}/request-review`, { lecturerId }),
};

export const lecturerApi = {
  reviewQueue: (status) => api.get('/api/lecturer/reviews', { params: { status } }),
  updateDecision: (videoId, decision) => api.patch(`/api/lecturer/reviews/${videoId}`, { decision }),
};


