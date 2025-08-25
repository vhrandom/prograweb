import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Package, 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Upload
} from "lucide-react";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const [stats] = useState({
    totalProducts: 24,
    totalOrders: 156,
    totalRevenue: 45680000,
    pendingOrders: 8
  });

  const [products] = useState([
    { 
      id: "1", 
      title: "iPhone 15 Pro Max", 
      price: 1299990, 
      stock: 15, 
      status: "active",
      sales: 45
    },
    { 
      id: "2", 
      title: "MacBook Pro 14\" M3", 
      price: 2199990, 
      stock: 8, 
      status: "active",
      sales: 23
    },
    { 
      id: "3", 
      title: "AirPods Pro", 
      price: 279990, 
      stock: 0, 
      status: "out_of_stock",
      sales: 67
    },
  ]);

  const [recentOrders] = useState([
    { id: "ORD-001", product: "iPhone 15 Pro Max", buyer: "María González", total: 1299990, status: "shipped", date: "2024-01-15" },
    { id: "ORD-002", product: "MacBook Pro 14\"", buyer: "Carlos Mendoza", total: 2199990, status: "pending", date: "2024-01-14" },
    { id: "ORD-003", product: "AirPods Pro", buyer: "Ana Rodríguez", total: 279990, status: "delivered", date: "2024-01-13" },
  ]);

  if (user?.role !== 'seller') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Acceso denegado. Solo vendedores pueden ver esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Vendedor</h1>
        <p className="text-gray-600">Bienvenido, {user.name}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">+2 este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
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
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
          <TabsTrigger value="add-product">Agregar Producto</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{order.product}</p>
                        <p className="text-xs text-gray-600">{order.buyer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">CLP ${(order.total / 100).toLocaleString()}</p>
                        <Badge variant={order.status === 'delivered' ? 'default' : order.status === 'shipped' ? 'secondary' : 'outline'} className="text-xs">
                          {order.status === 'delivered' ? 'Entregado' : order.status === 'shipped' ? 'Enviado' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos Top</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{product.title}</p>
                        <p className="text-xs text-gray-600">{product.sales} ventas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">CLP ${(product.price / 100).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mis Productos</CardTitle>
              <Button onClick={() => setActiveTab("add-product")}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{product.title}</h3>
                      <p className="text-sm text-gray-600">CLP ${(product.price / 100).toLocaleString()}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={product.status === 'active' ? 'default' : 'destructive'}>
                          {product.status === 'active' ? 'Activo' : 'Sin Stock'}
                        </Badge>
                        <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                        <span className="text-sm text-gray-500">Ventas: {product.sales}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Todas las Órdenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.product}</p>
                      <p className="text-sm text-gray-500">Cliente: {order.buyer}</p>
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

        <TabsContent value="add-product">
          <Card>
            <CardHeader>
              <CardTitle>Agregar Nuevo Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del Producto</Label>
                    <Input id="title" placeholder="Ej: iPhone 15 Pro Max" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smartphones">Smartphones</SelectItem>
                        <SelectItem value="laptops">Laptops</SelectItem>
                        <SelectItem value="tablets">Tablets</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="smartwatch">Smartwatch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe tu producto en detalle..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (CLP)</Label>
                    <Input id="price" type="number" placeholder="1299990" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" placeholder="IPH15PM-256-TB" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input id="stock" type="number" placeholder="10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Imágenes del Producto</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Arrastra imágenes aquí o haz clic para seleccionar</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB cada una</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="flex-1">
                    Crear Producto
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setActiveTab("products")}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}