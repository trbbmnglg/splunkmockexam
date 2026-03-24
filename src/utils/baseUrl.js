/**
 * Single source of truth for the API base URL.
 * Import this instead of duplicating the ternary in every file.
 */
export const BASE_URL = import.meta.env.MODE === 'development'
  ? '/api'
  : 'https://splunkmockexam.gtaad-innovations.com/api';
