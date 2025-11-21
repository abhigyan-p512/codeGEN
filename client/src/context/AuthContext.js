// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Load from localStorage on mount (safely)
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("token");
      const storedUserRaw = localStorage.getItem("user");

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUserRaw && storedUserRaw !== "undefined") {
        try {
          const parsedUser = JSON.parse(storedUserRaw);
          setUser(parsedUser);
        } catch (err) {
          console.warn("Failed to parse stored user, clearing it:", err);
          localStorage.removeItem("user");
        }
      } else if (storedUserRaw === "undefined") {
        // clean up bad leftover value
        localStorage.removeItem("user");
      }
    } catch (err) {
      console.warn("Error reading auth from localStorage:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, []);

  // Login: save to state + localStorage
  function login(newToken, newUser) {
    setToken(newToken || null);
    setUser(newUser || null);

    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }

    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  }

  // Logout: clear everything
  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
