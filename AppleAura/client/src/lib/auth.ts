import { User } from "@shared/schema";

const API_BASE = "/api";

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.token = localStorage.getItem("auth-token");
    const savedUser = localStorage.getItem("auth-user");
    if (savedUser) {
      try {
        this.user = JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("auth-user");
      }
    }
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        passwordHash: password,
        name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    const data: AuthResponse = await response.json();
    this.setAuth(data);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
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

    const data: AuthResponse = await response.json();
    this.setAuth(data);
    return data;
  }

  async logout(): Promise<void> {
    this.token = null;
    this.user = null;
    localStorage.removeItem("auth-token");
    localStorage.removeItem("auth-user");
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          return null;
        }
        throw new Error("Failed to fetch user");
      }

      const data = await response.json();
      this.user = data.user;
      localStorage.setItem("auth-user", JSON.stringify(this.user));
      return this.user;
    } catch (error) {
      console.error("Error fetching current user:", error);
      this.logout();
      return null;
    }
  }

  private setAuth(data: AuthResponse): void {
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem("auth-token", this.token);
    localStorage.setItem("auth-user", JSON.stringify(this.user));
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }
}

export const authService = new AuthService();
