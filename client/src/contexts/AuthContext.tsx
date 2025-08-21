import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Faculty {
  id: number;
  name: string;
  email: string;
  role: "super_admin" | "instructor";
  title: string;
  department: string;
  institution: string;
  teamId?: number;
}

interface UserStats {
  loginCount: number;
  projectsCreated: number;
  templatesUsed: number;
  totalTimeSpent: number;
  lastActiveAt: string;
}

interface AuthContextType {
  faculty: Faculty | null;
  stats: UserStats | null;
  sessionId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signin: (sessionId: string, faculty: Faculty) => void;
  signout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const storedSessionId = localStorage.getItem("sessionId");
    const storedFaculty = localStorage.getItem("faculty");

    if (storedSessionId && storedFaculty) {
      try {
        const parsedFaculty = JSON.parse(storedFaculty);
        setSessionId(storedSessionId);
        setFaculty(parsedFaculty);
        // Refresh user data from server
        refreshUserData(storedSessionId);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem("sessionId");
        localStorage.removeItem("faculty");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUserData = async (currentSessionId?: string) => {
    const sessionToUse = currentSessionId || sessionId;
    if (!sessionToUse) return;

    try {
      const response = await apiRequest("/api/auth/me", "GET", undefined, {
        Authorization: `Bearer ${sessionToUse}`,
      }) as any;

      setFaculty(response.faculty);
      setStats(response.stats);
      
      // Update localStorage with fresh data
      localStorage.setItem("faculty", JSON.stringify(response.faculty));
    } catch (error) {
      // Session is invalid, clear auth state
      signout();
    } finally {
      setIsLoading(false);
    }
  };

  const signin = (newSessionId: string, newFaculty: Faculty) => {
    setSessionId(newSessionId);
    setFaculty(newFaculty);
    setIsLoading(false);
  };

  const signout = async () => {
    if (sessionId) {
      try {
        await apiRequest("/api/auth/logout", "POST", undefined, {
          Authorization: `Bearer ${sessionId}`,
        });
      } catch (error) {
        // Continue with logout even if server request fails
        console.error("Logout request failed:", error);
      }
    }

    setSessionId(null);
    setFaculty(null);
    setStats(null);
    localStorage.removeItem("sessionId");
    localStorage.removeItem("faculty");
  };

  const refreshUser = async () => {
    await refreshUserData();
  };

  const value: AuthContextType = {
    faculty,
    stats,
    sessionId,
    isLoading,
    isAuthenticated: !!faculty && !!sessionId,
    signin,
    signout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}