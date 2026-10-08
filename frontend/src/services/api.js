import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("fleetflow_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear invalid session if unauthenticated
      const currentPath = window.location.pathname;
      if (currentPath !== "/login") {
        localStorage.removeItem("fleetflow_token");
        localStorage.removeItem("fleetflow_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;