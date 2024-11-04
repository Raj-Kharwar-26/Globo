import React, { createContext, useContext, useState, useEffect } from "react";

import axios from "axios";

interface User {
  id: string;

  phoneNumber: string;

  isAdmin?: boolean;

  virtualNumbers: Array<{
    _id: string;

    number: string;

    country: string;

    active: boolean;

    rented: boolean;

    expiresAt: string;
  }>;
}

interface VirtualNumber {
  id: string;

  number: string;

  country: string;

  active: boolean;

  rented: boolean;

  expiresAt: string;

  rentedAt?: string;

  price?: number;
}

interface AuthContextType {
  user: User | null;

  login: (phoneNumber: string, password: string) => Promise<void>;

  register: (phoneNumber: string, password: string) => Promise<void>;

  logout: () => void;

  generateNumber: (country: string) => Promise<VirtualNumber[]>;

  updateNumberStatus: (
    numberId: string,

    active: boolean
  ) => Promise<VirtualNumber[]>;
}

export const API_URL = "https://7a61-2409-40e0-48-d2fa-7874-d1b9-5cad-6149.ngrok-free.app/api"; // Updated port to match backend

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        const isServerConnected = await checkServerConnection();

        if (!isServerConnected) {
          console.log("Server not connected");

          localStorage.removeItem("token");

          setUser(null);

          return;
        }

        loadUser(token);
      }
    };

    init();
  }, []);

  const loadUser = async (token: string) => {
    try {
      console.log("Loading user with token");

      const config = {
        headers: {
          "x-auth-token": token,
        },
      };

      const tokenData = JSON.parse(atob(token.split(".")[1]));

      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds

      if (Date.now() >= expirationTime) {
        console.log("Token expired");

        localStorage.removeItem("token");

        setUser(null);

        return;
      }

      const res = await axios.get(`${API_URL}/auth/profile`, config);

      console.log("User loaded:", res.data);

      if (!res.data._id) {
        console.log("Invalid server response");

        localStorage.removeItem("token");

        setUser(null);

        return;
      }

      setUser({
        id: res.data._id,

        phoneNumber: res.data.phoneNumber,

        virtualNumbers: res.data.virtualNumbers || [],
      });
    } catch (err) {
      console.error("Error loading user:", err);

      localStorage.removeItem("token");

      setUser(null);
    }
  };

  const checkServerConnection = async () => {
    try {
      await axios.get(`${API_URL}/auth/check`);

      return true;
    } catch (err) {
      return false;
    }
  };

  const register = async (phoneNumber: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        phoneNumber,

        password,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);

        setUser({
          id: res.data.user.id,

          phoneNumber: res.data.user.phoneNumber,

          virtualNumbers: res.data.user.virtualNumbers || [],
        });
      } else {
        throw new Error("No token received");
      }
    } catch (err: any) {
      console.error("Registration error:", err.response?.data || err.message);

      throw new Error(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    }
  };

  const login = async (phoneNumber: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        phoneNumber,

        password,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);

        setUser({
          id: res.data.user.id,

          phoneNumber: res.data.user.phoneNumber,

          virtualNumbers: res.data.user.virtualNumbers || [],
        });
      } else {
        throw new Error("No token received");
      }
    } catch (err: any) {
      console.error("Login error:", err.response?.data || err.message);

      localStorage.removeItem("token");

      setUser(null);

      throw new Error(
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");

    setUser(null);
  };

  const generateNumber = async (country: string): Promise<VirtualNumber[]> => {
    try {
      const token = localStorage.getItem("token");

      if (!token) throw new Error("No authentication token");

      const config = {
        headers: {
          "x-auth-token": token,
        },
      };

      const res = await axios.post(
        `${API_URL}/phone/generate`,

        { country },

        config
      );

      setUser((prev) => (prev ? { ...prev, virtualNumbers: res.data } : null));

      return res.data;
    } catch (err: any) {
      console.error(
        "Generate number error:",

        err.response?.data || err.message
      );

      throw new Error(
        err.response?.data?.message || "Failed to generate number"
      );
    }
  };

  const updateNumberStatus = async (
    numberId: string,

    active: boolean
  ): Promise<VirtualNumber[]> => {
    try {
      const token = localStorage.getItem("token");

      if (!token) throw new Error("No authentication token");

      const config = {
        headers: {
          "x-auth-token": token,
        },
      };

      const res = await axios.patch(
        `${API_URL}/phone/status/${numberId}`,

        { active },

        config
      );

      setUser((prev) => (prev ? { ...prev, virtualNumbers: res.data } : null));

      return res.data;
    } catch (err: any) {
      console.error(
        "Update number status error:",

        err.response?.data || err.message
      );

      throw new Error(
        err.response?.data?.message || "Failed to update number status"
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,

        login,

        register,

        logout,

        generateNumber,

        updateNumberStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
