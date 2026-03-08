import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://anyforge-ai-production.up.railway.app';

export const api = axios.create({
  baseURL: API_BASE_URL,
});
