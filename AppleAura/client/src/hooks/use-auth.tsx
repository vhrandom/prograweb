import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@shared/schema";
import { authService } from "@/lib/auth"; // Asumo que authService también devuelve el token

// --- 1. AÑADE 'token' AL TIPO ---
interface AuthContextType {
  user: User | null;
  token: string | null; // <-- AÑADIDO
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define una constante para la llave del token
const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // --- 2. LEE EL TOKEN DIRECTAMENTE DE LOCALSTORAGE ---
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY); // <-- ARREGLO
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Si hay un token en el estado (leído de localStorage), 
        // intenta obtener el usuario.
        if (token) {
          // Asumimos que getCurrentUser() usa el token guardado en authService
          // o que authService se inicializa con el token.
          // Si no es así, authService.getCurrentUser(token) podría ser necesario.
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        // Si el token es inválido (ej. expiró), lo limpiamos
        localStorage.removeItem(TOKEN_KEY); // <-- ARREGLO
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [token]); // Se ejecuta solo si el 'token' cambia

  const login = async (email: string, password: string) => {
    // 3. 'authService.login' DEBE devolver { user, token }
    const { user, token } = await authService.login(email, password);

    // --- 4. GUARDA EL TOKEN EN LOCALSTORAGE ---
    localStorage.setItem(TOKEN_KEY, token); // <-- ARREGLO

    setUser(user);
    setToken(token); // Guarda el token en el estado de React
  };

  const register = async (email: string, password: string, name: string, role: string = 'buyer') => {
    // 3. 'authService.register' DEBE devolver { user, token }
    const { user, token } = await authService.register(email, password, name, role);

    // --- 4. GUARDA EL TOKEN EN LOCALSTORAGE ---
    localStorage.setItem(TOKEN_KEY, token); // <-- ARREGLO

    setUser(user);
    setToken(token); // Guarda el token en el estado de React
  };

  const logout = async () => {
    await authService.logout(); // Esto debería invalidar el token en el backend si es necesario

    // --- 5. LIMPIA EL TOKEN DE LOCALSTORAGE ---
    localStorage.removeItem(TOKEN_KEY); // <-- ARREGLO

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token, // <-- 6. PROVEE EL TOKEN
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
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