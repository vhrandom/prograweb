
import { Button } from "@/components/ui/button";
import { useNavigate } from "wouter";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Icono */}
        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
          <Search className="w-12 h-12 text-white" />
        </div>

        {/* Título */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-slate-900">404</h1>
          <h2 className="text-2xl font-semibold text-slate-700">
            Página no encontrada
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            La página que estás buscando no existe o ha sido movida. 
            Te invitamos a explorar nuestros increíbles productos Apple.
          </p>
        </div>

        {/* Botones de navegación */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ir al inicio
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver atrás
          </Button>
        </div>

        {/* Enlaces útiles */}
        <div className="pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-4">Enlaces útiles:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              Productos
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => navigate("/auth")}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              Iniciar Sesión
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => navigate("/cart")}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              Carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
