import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export function useAuth() {
  const token = useAuthStore((s) => s.token);
  const setToken = useAuthStore((s) => s.setToken);
  const clearToken = useAuthStore((s) => s.clearToken);
  const navigate = useNavigate();

  const login = useCallback(
    (newToken: string, redirectTo = "/") => {
      setToken(newToken);
      navigate(redirectTo, { replace: true });
    },
    [setToken, navigate],
  );

  const logout = useCallback(() => {
    clearToken();
    navigate("/login", { replace: true });
  }, [clearToken, navigate]);

  return {
    token,
    isAuthenticated: Boolean(token), // derived — never undefined
    login,
    logout,
  };
}
