import { useContext } from "react";
import { AuthContext } from "../auth.context.jsx";
import { login, register, logout, getme } from "../services/auth.api.js";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  const { user, setUser, loading, setLoading } = context;

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await login({ email, password });
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);
    try {
      const data = await register({ username, email, password });
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("Register failed:", error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    setUser(null);
    setLoading(false);
  };

  const handleGetMe = async () => {
    setLoading(true);
    const data = await getme();
    setUser(data.user);
    setLoading(false);
  };

  return {
    user,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    handleGetMe,
  };
};