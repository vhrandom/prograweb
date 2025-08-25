import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { login, register, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión exitosamente",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales inválidas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerName || !registerEmail || !registerPassword || !confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword !== confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "Las contraseñas deben ser idénticas",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await register(registerEmail, registerPassword, registerName);
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Bienvenido a Silicon Trail",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error al crear cuenta",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-apple-gray-6 to-white dark:from-apple-dark-1 dark:to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="gradient-mesh absolute inset-0"></div>
      
      {/* Floating Icons */}
      <div className="absolute top-20 left-10 w-12 h-12 bg-gradient-to-br from-tech-blue to-apple-blue rounded-xl flex items-center justify-center animate-float opacity-30">
        <Zap className="w-6 h-6 text-white" />
      </div>
      <div className="absolute top-32 right-16 w-10 h-10 bg-gradient-to-br from-tech-green to-apple-green rounded-lg flex items-center justify-center animate-float opacity-20" style={{ animationDelay: '1s' }}>
        <span className="text-white text-sm">📱</span>
      </div>
      <div className="absolute bottom-20 right-20 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center animate-float opacity-25" style={{ animationDelay: '2s' }}>
        <span className="text-white text-lg">🎧</span>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-6 hover:bg-white/10 dark:hover:bg-black/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-tech-blue rounded-xl flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <span className="text-title-1 font-semibold">Silicon Trail</span>
            </div>
            <p className="text-body text-apple-gray-1 dark:text-apple-gray-2">
              Tu marketplace tecnológico de confianza
            </p>
          </div>

          <Card className="glass-effect border-apple-gray-5 dark:border-apple-dark-3 shadow-apple-xl animate-scale-in">
            <CardContent className="p-0">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-apple-gray-6 dark:bg-apple-dark-3">
                  <TabsTrigger value="login" className="text-body font-medium">
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-body font-medium">
                    Registrarse
                  </TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="p-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-body font-medium">
                        Correo electrónico
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="bg-white dark:bg-apple-dark-2 border-apple-gray-3 dark:border-apple-dark-4 focus:ring-apple-blue focus:border-apple-blue"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-body font-medium">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="bg-white dark:bg-apple-dark-2 border-apple-gray-3 dark:border-apple-dark-4 focus:ring-apple-blue focus:border-apple-blue pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-apple-gray-1" />
                          ) : (
                            <Eye className="w-4 h-4 text-apple-gray-1" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-right">
                      <Button variant="ghost" className="text-apple-blue hover:text-blue-600 text-footnote p-0">
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-500 py-3 text-body font-semibold shadow-glow-blue transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Iniciando sesión...</span>
                        </div>
                      ) : (
                        "Iniciar Sesión"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* Register Tab */}
                <TabsContent value="register" className="p-6">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-body font-medium">
                        Nombre completo
                      </Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Tu nombre"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="bg-white dark:bg-apple-dark-2 border-apple-gray-3 dark:border-apple-dark-4 focus:ring-apple-blue focus:border-apple-blue"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-body font-medium">
                        Correo electrónico
                      </Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="bg-white dark:bg-apple-dark-2 border-apple-gray-3 dark:border-apple-dark-4 focus:ring-apple-blue focus:border-apple-blue"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-body font-medium">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="bg-white dark:bg-apple-dark-2 border-apple-gray-3 dark:border-apple-dark-4 focus:ring-apple-blue focus:border-apple-blue pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 text-apple-gray-1" />
                          ) : (
                            <Eye className="w-4 h-4 text-apple-gray-1" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-body font-medium">
                        Confirmar contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-white dark:bg-apple-dark-2 border-apple-gray-3 dark:border-apple-dark-4 focus:ring-apple-blue focus:border-apple-blue pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4 text-apple-gray-1" />
                          ) : (
                            <Eye className="w-4 h-4 text-apple-gray-1" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="text-footnote text-apple-gray-1">
                      Al registrarte, aceptas nuestros{" "}
                      <Button variant="link" className="text-apple-blue hover:text-blue-600 p-0 h-auto font-normal">
                        Términos de Servicio
                      </Button>{" "}
                      y{" "}
                      <Button variant="link" className="text-apple-blue hover:text-blue-600 p-0 h-auto font-normal">
                        Política de Privacidad
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-500 py-3 text-body font-semibold shadow-glow-blue transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Creando cuenta...</span>
                        </div>
                      ) : (
                        "Crear Cuenta"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Additional Links */}
          <div className="text-center mt-6">
            <p className="text-footnote text-apple-gray-1">
              ¿Quieres vender tus productos?{" "}
              <Button variant="link" className="text-apple-blue hover:text-blue-600 p-0 h-auto font-normal">
                Únete como vendedor
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
