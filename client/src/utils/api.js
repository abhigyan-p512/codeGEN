// client/src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // change if your server URL/port differs
});

// Always attach the *current* token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
