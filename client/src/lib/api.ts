import axios from "axios";

const baseURL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env?.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5001/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
