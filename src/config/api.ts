const KAN_API_URL = import.meta.env.VITE_API_BASE_URL_KAN || 'https://kan-api.lspgatensi.id/api'
const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const API_BASE_URL = import.meta.env.VITE_SAAT_INI === 'KAN' ? KAN_API_URL : DEFAULT_API_URL