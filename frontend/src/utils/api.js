import axios from 'axios'

// Jika di development lokal terpisah (Vite), kita arahkan ke backend 8000
// Jika sudah digabung dengan backend, gunakan relative path agar mengikuti domain saat ini.
const isDev = window.location.hostname === 'localhost' && window.location.port === '5173';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (isDev ? 'http://localhost:8000' : '');

const api = axios.create({
  baseURL: BASE_URL,
})

export default api
