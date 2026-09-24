import { createContext, useContext, useEffect, useState } from "react";
import api, { setAuthToken } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "stocksense-token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  // Keep axios default header + localStorage in sync with token state
  useEffect(() => {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
      setAuthToken(token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
    }
  }, [token]);

  // On first load, if a token exists, fetch the current profile from
  // GET /api/auth/profile so the app knows who's logged in after a refresh.
  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/profile");
        setUser(data.user || data.data || null);
      } catch (err) {
        // Token invalid or expired — log the user out client-side.
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
