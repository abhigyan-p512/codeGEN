// client/src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const storedToken = sessionStorage.getItem("token");
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch logged-in user profile when token changes
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserProfile();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    sessionStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
