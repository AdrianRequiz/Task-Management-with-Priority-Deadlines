import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Replace with your computer's IP
const API_BASE = 'http://192.168.0.101:8000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const login = async (email: string, password: string) => {
    const response = await api.post('/jwt/create/', { email, password });
    await AsyncStorage.setItem('access_token', response.data.access);
    await AsyncStorage.setItem('refresh_token', response.data.refresh);
    return response.data;
};

export const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
};

// Projects
export const getProjects = () => api.get('/projects/');
export const createProject = (data: any) => api.post('/projects/', data);
export const updateProject = (id: number, data: any) => api.put(`/projects/${id}/`, data);
export const deleteProject = (id: number) => api.delete(`/projects/${id}/`);

// Tasks
export const getTasks = () => api.get('/tasks/');
export const createTask = (data: any) => api.post('/tasks/', data);
export const updateTask = (id: number, data: any) => api.put(`/tasks/${id}/`, data);
export const deleteTask = (id: number) => api.delete(`/tasks/${id}/`);
export const updateTaskStatus = (id: number, status: string) => api.patch(`/tasks/${id}/`, { status });

// Dashboard stats
export const getDashboardStats = () => api.get('/dashboard/stats/');

// Profile
export const getProfile = () => api.get('/profile/');
export const updateProfile = (data: any) => api.put('/profile/', data);

// Chatbot
export const sendChatMessage = (message: string) => api.post('/chatbot/', { message });

export default api;