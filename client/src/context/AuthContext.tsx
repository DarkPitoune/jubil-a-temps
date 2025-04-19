import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const API_URL = "https://jubilapi.pcdhebrail.ovh/api";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      let parsedUser: User;
      try {
        parsedUser = JSON.parse(storedUser);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setLoading(false);
        return;
      }
      setUser(parsedUser);
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Login user
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);

      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register user
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);

      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
