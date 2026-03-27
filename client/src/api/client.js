import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const rawToken = localStorage.getItem("token");
  if (rawToken) {
    let token = rawToken;
    try {
      token = JSON.parse(rawToken);
    } catch {
      token = rawToken;
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
