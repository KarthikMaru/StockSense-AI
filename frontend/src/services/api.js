import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Sets or clears the Authorization header used on every subsequent request.
 * Called by AuthContext whenever the JWT token changes.
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Global response interceptor: if a request comes back 401, the token is
// invalid/expired. We don't force a redirect here (that's a UI decision
// left to individual pages/AuthContext) but we normalize the error.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || error?.message || "Something went wrong. Please try again.";
    return Promise.reject({ ...error, message });
  }
);

export default api;
