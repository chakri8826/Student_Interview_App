import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    try { localStorage.setItem('access_token', token) } catch { }
  } else {
    delete api.defaults.headers.common['Authorization']
    try { localStorage.removeItem('access_token') } catch { }
  }
  // Notify app about auth state change (same-tab)
  try {
    window.dispatchEvent(new Event('auth-changed'))
  } catch { }
}

// Initialize from localStorage on load
const existingToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
if (existingToken) setAuthToken(existingToken)

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token')
      localStorage.removeItem('name')
      setAuthToken(null)
      window.location.href = '/login'
      toast.error('Session expired. Please login again.')
    } else if (error.response?.data?.detail) {
      toast.error(error.response.data.detail)
    } else {
      toast.error('An error occurred. Please try again.')
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string; city?: string; phone?: string }) =>
    api.post('/api/v1/auth/register', data),

  login: (data: { username: string; password: string }) =>
    api.post('/api/v1/auth/login', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      transformRequest: [(data) => {
        const params = new URLSearchParams()
        Object.entries(data).forEach(([key, value]) => {
          params.append(key, value as string)
        })
        return params
      }]
    }),

  refresh: () =>
    api.post('/api/v1/auth/refresh'),

  logout: () =>
    api.post('/api/v1/auth/logout'),

  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/google`
  },

  linkedinLogin: () => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/linkedin`
  },

  microsoftLogin: () => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/microsoft`
  },
}

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/api/v1/me'),
  updateProfile: (profileData: { full_name?: string; phone?: string; city?: string }) =>
    api.put('/api/v1/me/profile', profileData),
}

// Roles API
export const rolesAPI = {
  getRoles: () => api.get('/api/v1/roles'),
  getUserRoles: () => api.get('/api/v1/my/roles'),
  addRoleSelection: (roleIds: number[]) => api.post('/api/v1/my/roles', { role_ids: roleIds }),
  setUserRoles: (roleIds: number[]) => api.post('/api/v1/my/roles/set', { role_ids: roleIds }),
}

// CV API
export const cvsAPI = {
  presignUpload: (data: { filename: string; mime_type: string; role_id?: number }) =>
    api.post('/api/v1/cvs/presign', data),

  confirmUpload: (data: { filename: string; storage_filename: string; role_id?: number; size_bytes: number }) =>
    api.post('/api/v1/cvs/confirm', data),

  getUserCVs: (skip = 0, limit = 10) =>
    api.get(`/api/v1/cvs?skip=${skip}&limit=${limit}`),

  deleteCV: (cvId: number) =>
    api.delete(`/api/v1/cvs/${cvId}`),

  getDownloadUrl: (cvId: number) =>
    api.get(`/api/v1/cvs/${cvId}/download`),
}

// Payment & Wallet API
export const walletAPI = {
  getWallet: () => api.get('/api/v1/wallet'),
  getTransactions: (skip = 0, limit = 10) =>
    api.get(`/api/v1/transactions?skip=${skip}&limit=${limit}`),
  createPaymentOrder: (packId: number) => api.post('/api/v1/payments/order', { pack_id: packId }),
}

// Interview API (placeholder for future implementation)
export const interviewAPI = {
  startInterview: (data: { role_id: number; cv_id?: number }) =>
    api.post('/api/v1/interviews/start', data),
}

// Screening API (placeholder for future implementation)
export const screeningAPI = {
  runScreening: (cv_id: number) =>
    api.post('/api/v1/screenings/run', { cv_id }),
}

// Persona API (placeholder for future implementation)
export const personaAPI = {
  getPersona: () => api.get('/api/v1/personas/current'),
  computePersona: () => api.post('/api/v1/personas/compute'),
}

export const activityAPI = {
  getActivities: (limit = 20) => api.get(`/api/v1/activities?limit=${limit}`),
}
