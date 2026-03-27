import { createContext, useCallback, useContext, useMemo } from "react";
import api from "../api/client";
import { useLocalStorage } from "../hooks/useLocalStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage("user", null);
  const [token, setToken] = useLocalStorage("token", null);

  const login = useCallback(async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    setUser(response.data.user);
    setToken(response.data.token);
  }, [setToken, setUser]);

  const register = useCallback(async (name, email, password) => {
    const response = await api.post("/auth/register", { name, email, password });
    setUser(response.data.user);
    setToken(response.data.token);
  }, [setToken, setUser]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout is still successful client-side.
    } finally {
      setUser(null);
      setToken(null);
    }
  }, [setToken, setUser]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
    }),
    [login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
