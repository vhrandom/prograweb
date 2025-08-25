
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardContent className="pt-6">
          {/* Logo Apple Estilizado */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 21.99C7.85 22.03 6.8 20.68 5.96 19.46C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.19 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5Z"/>
                <path d="M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Página no encontrada
            </h1>
            <p className="text-gray-600 mb-6">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
          </div>

          {/* Error 404 Estilizado */}
          <div className="mb-8">
            <span className="text-6xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              404
            </span>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver atrás
            </Button>
            
            <Button
              variant="ghost"
              onClick={() => navigate("/products")}
              className="w-full text-gray-600 hover:text-gray-900"
            >
              <Search className="w-4 h-4 mr-2" />
              Explorar productos
            </Button>
          </div>

          {/* Enlaces útiles */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">
              Enlaces útiles:
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <button
                onClick={() => navigate("/")}
                className="text-blue-600 hover:underline"
              >
                Inicio
              </button>
              <button
                onClick={() => navigate("/products")}
                className="text-blue-600 hover:underline"
              >
                Productos
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="text-blue-600 hover:underline"
              >
                Mi cuenta
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
