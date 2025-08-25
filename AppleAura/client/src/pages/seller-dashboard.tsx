import { useState } from "react";
import { useLocation } from "wouter";
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Star, 
  Settings, 
  Plus,
  Eye,
  Edit,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/currency";

export default function SellerDashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Redirect if not seller
  if (!isAuthenticated || user?.role !== 'seller') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-apple-gray-1" />
          </div>
          <h1 className="text-title-1 font-semibold mb-4">Acceso de Vendedor Requerido</h1>
          <p className="text-body text-apple-gray-1 mb-6">
            Necesitas ser un vendedor verificado para acceder a este panel
          </p>
          <Button onClick={() => setLocation("/")}>
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  const { data: sellerProfile } = useQuery({
    queryKey: ["/api/seller/profile"],
    queryFn: async () => {
      const response = await fetch("/api/seller/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch seller profile");
      return response.json();
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products", { sellerId: sellerProfile?.id }],
    queryFn: async () => {
      if (!sellerProfile?.id) return [];
      const response = await fetch(`/api/products?sellerId=${sellerProfile.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: !!sellerProfile?.id,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/seller/orders"],
    queryFn: async () => {
      const response = await fetch("/api/seller/orders", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json();
    },
  });

  // Mock KPIs (would be calculated from real data)
  const kpis = {
    monthlySales: 245000000, // $2.450.000 in cents
    pendingOrders: orders.filter((order: any) => order.status === 'pending').length,
    averageRating: 4.8,
    activeProducts: products.filter((product: any) => product.status === 'active').length,
  };

  const sidebarItems = [
    { icon: BarChart3, label: "Dashboard", value: "dashboard", active: true },
    { icon: Package, label: "Productos", value: "products", badge: products.length },
    { icon: ShoppingBag, label: "Órdenes", value: "orders", badge: kpis.pendingOrders },
    { icon: Star, label: "Reseñas", value: "reviews" },
    { icon: Settings, label: "Configuración", value: "settings" },
  ];

  return (
    <div className="min-h-screen bg-apple-gray-6 dark:bg-apple-dark-1">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-apple-dark-2 border-r border-apple-gray-5 dark:border-apple-dark-3 min-h-screen">
          <div className="p-6">
            <h2 className="text-title-2 font-semibold text-gray-900 dark:text-white mb-6">Panel de Vendedor</h2>
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
                        {item.badge}
                      </Badge>
                    )}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="hidden">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="orders">Órdenes</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-8">
              {/* Welcome Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-title-1 font-semibold text-gray-900 dark:text-white">
                    ¡Hola, {sellerProfile?.displayName || user?.name}! 👋
                  </h1>
                  <p className="text-body text-apple-gray-1 mt-1">
                    Aquí tienes un resumen de tu tienda
                  </p>
                </div>
                <Button 
                  onClick={() => setLocation("/seller/products/new")}
                  className="button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="glass-effect border-apple-gray-5 dark:border-apple-dark-3 hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-footnote text-apple-gray-1">Ventas del Mes</p>
                        <p className="text-title-1 font-bold text-gray-900 dark:text-white">
                          {formatPrice(kpis.monthlySales)}
                        </p>
                        <p className="text-caption-1 text-apple-green flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +12.5%
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
                        <p className="text-footnote text-apple-gray-1">Órdenes Pendientes</p>
                        <p className="text-title-1 font-bold text-gray-900 dark:text-white">
                          {kpis.pendingOrders}
                        </p>
                        <p className="text-caption-1 text-apple-red">Requiere atención</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-apple-red to-orange-500 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-apple-gray-5 dark:border-apple-dark-3 hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-footnote text-apple-gray-1">Rating Promedio</p>
                        <p className="text-title-1 font-bold text-gray-900 dark:text-white">
                          {kpis.averageRating}
                        </p>
                        <p className="text-caption-1 text-apple-green flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          Excelente
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-apple-gray-5 dark:border-apple-dark-3 hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-footnote text-apple-gray-1">Productos Activos</p>
                        <p className="text-title-1 font-bold text-gray-900 dark:text-white">
                          {kpis.activeProducts}
                        </p>
                        <p className="text-caption-1 text-apple-blue flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending: 3
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-apple-blue to-tech-blue rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="border-apple-gray-5 dark:border-apple-dark-3">
                <CardHeader>
                  <CardTitle className="text-title-2 font-semibold">Órdenes Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-6 h-6 text-apple-gray-1" />
                      </div>
                      <p className="text-body text-apple-gray-1">Aún no tienes órdenes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order: any) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-apple-gray-6 dark:bg-apple-dark-3 rounded-xl hover:bg-apple-gray-5 dark:hover:bg-apple-dark-4 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-apple-gray-4 dark:bg-apple-dark-4 rounded-lg flex items-center justify-center">
                              <Package className="w-6 h-6 text-apple-gray-1" />
                            </div>
                            <div>
                              <p className="text-headline font-semibold text-gray-900 dark:text-white">
                                Orden #{order.id.slice(0, 8)}
                              </p>
                              <p className="text-footnote text-apple-gray-1">
                                Cliente: Usuario
                              </p>
                              <p className="text-footnote text-apple-gray-1">
                                {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-headline font-semibold text-gray-900 dark:text-white">
                              {formatPrice(order.unitPriceCents * order.quantity)}
                            </p>
                            <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                              En preparación
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-title-1 font-semibold">Mis Productos</h1>
                <Button className="button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </div>

              {products.length === 0 ? (
                <Card className="border-apple-gray-5 dark:border-apple-dark-3">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="w-8 h-8 text-apple-gray-1" />
                    </div>
                    <h3 className="text-title-3 font-semibold mb-2">Aún no tienes productos</h3>
                    <p className="text-body text-apple-gray-1 mb-6">
                      Comienza creando tu primer producto para empezar a vender
                    </p>
                    <Button className="button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Producto
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-apple-gray-5 dark:border-apple-dark-3">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-apple-gray-6 dark:bg-apple-dark-3">
                          <tr>
                            <th className="px-6 py-3 text-left text-subheadline font-medium text-apple-gray-1">Producto</th>
                            <th className="px-6 py-3 text-left text-subheadline font-medium text-apple-gray-1">Estado</th>
                            <th className="px-6 py-3 text-left text-subheadline font-medium text-apple-gray-1">Precio</th>
                            <th className="px-6 py-3 text-left text-subheadline font-medium text-apple-gray-1">Stock</th>
                            <th className="px-6 py-3 text-left text-subheadline font-medium text-apple-gray-1">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-apple-gray-5 dark:divide-apple-dark-3">
                          {products.map((product: any) => (
                            <tr key={product.id} className="hover:bg-apple-gray-6 dark:hover:bg-apple-dark-3 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-apple-gray-4 dark:bg-apple-dark-4 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-apple-gray-1" />
                                  </div>
                                  <div>
                                    <p className="text-body font-medium text-gray-900 dark:text-white">
                                      {product.title}
                                    </p>
                                    <p className="text-footnote text-apple-gray-1">
                                      ID: {product.id.slice(0, 8)}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={
                                  product.status === 'active' 
                                    ? "bg-apple-green text-white"
                                    : product.status === 'draft'
                                    ? "bg-apple-gray-3 text-gray-700"
                                    : "bg-apple-red text-white"
                                }>
                                  {product.status === 'active' ? 'Activo' : 
                                   product.status === 'draft' ? 'Borrador' : 'Pausado'}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-body text-gray-900 dark:text-white">
                                Desde {formatPrice(0)} {/* Would show min variant price */}
                              </td>
                              <td className="px-6 py-4 text-body text-gray-900 dark:text-white">
                                -
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
