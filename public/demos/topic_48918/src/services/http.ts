import axios from 'axios';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
  timeout: 10000,
});

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
