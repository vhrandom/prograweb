import { useState } from "react";
import { useLocation } from "wouter";
import { 
  BarChart3, 
  Users, 
  Store, 
  Tag, 
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Package,
  Target,
  CheckCircle,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/currency";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-apple-gray-1" />
          </div>
          <h1 className="text-title-1 font-semibold mb-4">Acceso de Administrador Requerido</h1>
          <p className="text-body text-apple-gray-1 mb-6">
            Necesitas permisos de administrador para acceder a este panel
          </p>
          <Button onClick={() => setLocation("/")}>
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  // Mock admin data (would come from actual APIs)
  const adminKPIs = {
    activeUsers: 12450,
    totalSales: 4520000000, // $45.2M in cents
    totalProducts: 8920,
    conversionRate: 3.8,
    pendingModerations: 12,
    totalOrders: 25800,
    monthlyGrowth: 15.7,
    averageOrderValue: 17500000, // $175k in cents
  };

  const sidebarItems = [
    { icon: BarChart3, label: "Analytics", value: "analytics", active: true },
    { icon: Users, label: "Usuarios", value: "users", badge: adminKPIs.activeUsers },
    { icon: Store, label: "Vendedores", value: "sellers" },
    { icon: Tag, label: "Categorías", value: "categories" },
    { icon: ShieldCheck, label: "Moderación", value: "moderation", badge: adminKPIs.pendingModerations },
  ];

  // Mock moderation queue
  const moderationQueue = [
    {
      id: "1",
      type: "product",
      title: "Monitor Gaming ASUS ROG 27\" 4K",
      seller: "GamerTech Pro",
      submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150",
    },
    {
      id: "2",
      type: "review",
      title: "Reseña de MacBook Pro M3",
      user: "Usuario123",
      submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-apple-gray-6 dark:bg-apple-dark-1">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-apple-dark-2 border-r border-apple-gray-5 dark:border-apple-dark-3 min-h-screen">
          <div className="p-6">
            <h2 className="text-title-2 font-semibold text-gray-900 dark:text-white mb-6">Panel Admin</h2>
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.value}
                    href="#"
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                      item.active
                        ? "bg-apple-blue text-white"
                        : "text-gray-700 dark:text-gray-300 hover:bg-apple-gray-6 dark:hover:bg-apple-dark-3"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-body font-medium">{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge className={`${
                        item.active ? "bg-white text-apple-blue" : "bg-apple-red text-white"
                      } text-caption-2`}>
                        {typeof item.badge === 'number' && item.badge > 1000 
                          ? `${(item.badge / 1000).toFixed(1)}k` 
                          : item.badge}
                      </Badge>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-title-1 font-semibold text-gray-900 dark:text-white">
              Panel de Administración 🚀
            </h1>
            <p className="text-body text-apple-gray-1 mt-1">
              Vista general del marketplace y herramientas de gestión
            </p>
          </div>

          {/* Admin KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-effect border-apple-gray-5 dark:border-apple-dark-3 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-footnote text-apple-gray-1">Usuarios Activos</p>
                    <p className="text-title-1 font-bold text-gray-900 dark:text-white">
                      {adminKPIs.activeUsers.toLocaleString()}
                    </p>
                    <p className="text-caption-1 text-apple-green flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8.2%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-apple-gray-5 dark:border-apple-dark-3 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-footnote text-apple-gray-1">Ventas Totales</p>
                    <p className="text-title-1 font-bold text-gray-900 dark:text-white">
                      {formatPrice(adminKPIs.totalSales).replace(/\$[\d,]+/, '$45.2M')}
                    </p>
                    <p className="text-caption-1 text-apple-green flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +{adminKPIs.monthlyGrowth}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-apple-green to-tech-green rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-apple-gray-5 dark:border-apple-dark-3 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-footnote text-apple-gray-1">Productos</p>
                    <p className="text-title-1 font-bold text-gray-900 dark:text-white">
                      {adminKPIs.totalProducts.toLocaleString()}
                    </p>
                    <p className="text-caption-1 text-apple-blue flex items-center">
                      🔍 Pendientes: {adminKPIs.pendingModerations}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-tech-blue rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-effect border-apple-gray-5 dark:border-apple-dark-3 hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-footnote text-apple-gray-1">Conversión</p>
                    <p className="text-title-1 font-bold text-gray-900 dark:text-white">
                      {adminKPIs.conversionRate}%
                    </p>
                    <p className="text-caption-1 text-apple-green flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      Objetivo: 4%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-apple-gray-5 dark:border-apple-dark-3">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <p className="text-title-2 font-bold text-gray-900 dark:text-white mb-1">
                  {Math.floor(adminKPIs.activeUsers * 0.05).toLocaleString()}
                </p>
                <p className="text-footnote text-apple-gray-1">Vendedores Activos</p>
              </CardContent>
            </Card>

            <Card className="border-apple-gray-5 dark:border-apple-dark-3">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <p className="text-title-2 font-bold text-gray-900 dark:text-white mb-1">
                  {adminKPIs.totalOrders.toLocaleString()}
                </p>
                <p className="text-footnote text-apple-gray-1">Órdenes Totales</p>
              </CardContent>
            </Card>

            <Card className="border-apple-gray-5 dark:border-apple-dark-3">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <p className="text-title-2 font-bold text-gray-900 dark:text-white mb-1">
                  {formatPrice(adminKPIs.averageOrderValue)}
                </p>
                <p className="text-footnote text-apple-gray-1">Ticket Promedio</p>
              </CardContent>
            </Card>
          </div>

          {/* Moderation Queue */}
          <Card className="border-apple-gray-5 dark:border-apple-dark-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-title-2 font-semibold">Cola de Moderación</CardTitle>
                <Badge className="bg-apple-red text-white">
                  {adminKPIs.pendingModerations} pendientes
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {moderationQueue.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-6 h-6 text-apple-gray-1" />
                  </div>
                  <p className="text-body text-apple-gray-1">No hay elementos pendientes de moderación</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moderationQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-apple-gray-6 dark:bg-apple-dark-3 rounded-xl hover:bg-apple-gray-5 dark:hover:bg-apple-dark-4 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-apple-gray-4 dark:bg-apple-dark-4 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-apple-gray-1" />
                          </div>
                        )}
                        <div>
                          <p className="text-headline font-semibold text-gray-900 dark:text-white">
                            {item.title}
                          </p>
                          <p className="text-footnote text-apple-gray-1">
                            {item.type === 'product' ? `Vendedor: ${item.seller}` : `Usuario: ${item.user}`}
                          </p>
                          <p className="text-footnote text-apple-gray-1">
                            Enviado {item.submittedAt.toLocaleDateString()} a las {item.submittedAt.toLocaleTimeString()}
                          </p>
                          {'rating' in item && (
                            <div className="flex items-center space-x-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-3 rounded-full ${
                                    i < item.rating! ? 'bg-yellow-400' : 'bg-apple-gray-3'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button className="button-haptic bg-apple-green dark:bg-apple-green-dark text-white hover:bg-green-600 dark:hover:bg-green-500">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprobar
                        </Button>
                        <Button className="button-haptic bg-apple-red dark:bg-apple-red-dark text-white hover:bg-red-600 dark:hover:bg-red-500">
                          <XCircle className="w-4 h-4 mr-2" />
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
