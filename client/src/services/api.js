import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  changePassword: (passwords) => api.post('/auth/change-password', passwords),
  createRider: (riderData) => api.post('/auth/riders', riderData),
  getRiders: () => api.get('/auth/riders')
};

// Lessons API
const lessons = {
  create: (formData) => api.post('/lessons', formData),
  update: (id, formData) => api.put(`/lessons/${id}`, formData),
  delete: (id) => api.delete(`/lessons/${id}`),
  getAll: () => api.get('/lessons'),
  getById: (id) => api.get(`/lessons/${id}`),
  assignRider: (lessonId, riderUsername) => 
    api.post(`/lessons/${lessonId}/assign`, { riderUsername }),
  unassignRider: (lessonId, riderUsername) => 
    api.post(`/lessons/${lessonId}/unassign`, { riderUsername }),
  getRiderLessons: (username) => api.get(`/lessons/rider/${username}`)
};

// Calendar Events API
const events = {
  getAll: () => api.get('/events'),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  getRange: (start, end) => 
    api.get('/events/range', { params: { start, end } })
};

// Helper functions
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

// Upload helper
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.imagePath;
  } catch (error) {
    throw new Error('Failed to upload image');
  }
};

export default {
  auth,
  lessons,
  events,
  setAuthToken,
  removeAuthToken,
  uploadImage
};
