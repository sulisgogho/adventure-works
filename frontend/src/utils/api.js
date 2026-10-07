import axios from 'axios'

// Karena sekarang kita menggunakan file JSON statis, kita tidak butuh URL backend lagi.
// Semua request API otomatis akan membaca dari folder public/api/ di frontend (atau Vercel CDN)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
})

export default api
