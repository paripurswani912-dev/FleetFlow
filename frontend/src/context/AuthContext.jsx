import { createContext, useContext, useState } from "react";
import { getRoleName } from "../utils/roleUtils";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem("fleetflow_token")
  );

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("fleetflow_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (accessToken, userData) => {
    localStorage.setItem("fleetflow_token", accessToken);
    localStorage.setItem("fleetflow_user", JSON.stringify(userData));

    setToken(accessToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("fleetflow_token");
    localStorage.removeItem("fleetflow_user");

    setToken(null);
    setUser(null);
  };

  const roleId = user?.role_id || null;
  const roleName = roleId ? getRoleName(roleId) : "";

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roleId,
        roleName,
        login,
        logout,
        isAuthenticated: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}