import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ShoppingBag, DollarSign, BarChart3, Eye, CheckCircle, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats] = useState({
    totalUsers: 1245,
    totalOrders: 3856,
    totalRevenue: 892450000,
    totalProducts: 156
  });

  const [recentOrders] = useState([
    { id: "ORD-001", user: "María González", total: 1299990, status: "delivered", date: "2024-01-15" },
    { id: "ORD-002", user: "Carlos Mendoza", total: 2199990, status: "shipped", date: "2024-01-14" },
    { id: "ORD-003", user: "Ana Rodríguez", total: 449990, status: "pending", date: "2024-01-14" },
  ]);

  const [pendingSellers] = useState([
    { id: "1", name: "TechStore Pro", email: "techstore@email.com", date: "2024-01-10" },
    { id: "2", name: "Digital World", email: "digital@email.com", date: "2024-01-12" },
  ]);

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Acceso denegado. Solo administradores pueden ver esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Bienvenido, {user.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CLP ${(stats.totalRevenue / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">+5% desde el mes pasado</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Órdenes Recientes</TabsTrigger>
          <TabsTrigger value="sellers">Vendedores Pendientes</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Órdenes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.user}</p>
                      <p className="text-sm text-gray-500">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">CLP ${(order.total / 100).toLocaleString()}</p>
                      <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'shipped' ? 'secondary' : 'outline'}>
                        {order.status === 'delivered' ? 'Entregado' : order.status === 'shipped' ? 'Enviado' : 'Pendiente'}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sellers">
          <Card>
            <CardHeader>
              <CardTitle>Vendedores Pendientes de Aprobación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSellers.map((seller) => (
                  <div key={seller.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{seller.name}</p>
                      <p className="text-sm text-gray-600">{seller.email}</p>
                      <p className="text-sm text-gray-500">Solicitado: {seller.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button size="sm" variant="destructive">
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reportes y Análisis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Ventas por Categoría</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Smartphones</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Laptops</span>
                      <span className="font-medium">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Audio</span>
                      <span className="font-medium">15%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Otros</span>
                      <span className="font-medium">10%</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-2">Usuarios Activos</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Compradores</span>
                      <span className="font-medium">1,180</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vendedores</span>
                      <span className="font-medium">45</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Administradores</span>
                      <span className="font-medium">5</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}