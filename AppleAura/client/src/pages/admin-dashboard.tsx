import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Settings,
  Bell,
  Search,
  Menu
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock Data for Charts
const revenueData = [
  { name: 'Ene', total: 1500000 },
  { name: 'Feb', total: 2300000 },
  { name: 'Mar', total: 3200000 },
  { name: 'Abr', total: 2800000 },
  { name: 'May', total: 4500000 },
  { name: 'Jun', total: 5100000 },
];

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
}

interface RevenueItem {
  name: string;
  total: number;
}

interface CategoryItem {
  name: string;
  value: number;
  color: string;
}

interface Order {
  id: string;
  userId: string;
  createdAt: string;
  totalCents: number;
  status: string;
}

interface Seller {
  id: string;
  displayName: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Product {
  id: string;
  title: string;
  category: string;
  sellerId: string;
}

const data = [
  { name: 'iPhone', value: 40, color: '#3b82f6' },
  { name: 'MacBook', value: 25, color: '#8b5cf6' },
  { name: 'iPad', value: 10, color: '#f59e0b' },
  { name: 'Audio', value: 15, color: '#ec4899' },
  { name: 'Otros', value: 10, color: '#10b981' },
];
function UsersView() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  if (isLoading) return <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />;

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle>Usuarios Registrados</CardTitle>
        <CardDescription>Gestión de usuarios de la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className={user.role === 'admin' ? 'bg-purple-50 text-purple-600' : user.role === 'seller' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}>
                      {user.role === 'buyer' ? 'Comprador' : user.role === 'seller' ? 'Vendedor' : 'Admin'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsView() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  if (isLoading) return <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />;

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle>Inventario de Productos</CardTitle>
        <CardDescription>Listado completo de productos en la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio Base</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products?.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{product.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">ID: {product.sellerId}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {/* Price handling might need adjustment if variants are not populated */}
                    Ver detalles
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function OrdersView() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  if (isLoading) return <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />;

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-gray-900">
      <CardHeader>
        <CardTitle>Historial de Órdenes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Orden</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{order.id.substring(0, 8)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">Usuario {order.userId.substring(0, 5)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">CLP ${(order.totalCents / 100).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                      {order.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancesView() {
  return (
    <div className="text-center py-12">
      <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Finanzas</h3>
      <p className="text-gray-500">Módulo de finanzas en desarrollo.</p>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="text-center py-12">
      <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuración</h3>
      <p className="text-gray-500">Opciones de configuración del sistema.</p>
    </div>
  );
}
export default function AdminDashboard() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const { toast } = useToast();

  // --- QUERIES ---
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery<RevenueItem[]>({
    queryKey: ["/api/admin/analytics/revenue"],
  });

  const { data: categoryData, isLoading: isLoadingCategories } = useQuery<CategoryItem[]>({
    queryKey: ["/api/admin/analytics/categories"],
  });

  const { data: recentOrders, isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: pendingSellers, isLoading: isLoadingSellers } = useQuery<Seller[]>({
    queryKey: ["/api/admin/sellers/pending"],
  });

  // --- MUTATIONS ---
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/sellers/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers/pending"] });
      toast({ title: "Vendedor aprobado", description: "El vendedor ha sido verificado correctamente." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo aprobar al vendedor.", variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/admin/sellers/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sellers/pending"] });
      toast({ title: "Vendedor rechazado", description: "La solicitud ha sido rechazada." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo rechazar al vendedor.", variant: "destructive" });
    }
  });

  if (isLoadingStats || isLoadingRevenue || isLoadingCategories || isLoadingOrders || isLoadingSellers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black">
        <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Acceso Denegado</h2>
            <p className="text-red-600 dark:text-red-300">Solo los administradores pueden acceder a este panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"
          } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 hidden md:flex flex-col fixed h-full z-20`}
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              A
            </div>
            {sidebarOpen && <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Admin</span>}
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {[
            { id: "dashboard", icon: BarChart3, label: "Dashboard" },
            { id: "orders", icon: ShoppingBag, label: "Órdenes" },
            { id: "users", icon: Users, label: "Usuarios" },
            { id: "products", icon: Package, label: "Productos" },
            { id: "finances", icon: DollarSign, label: "Finanzas" },
            { id: "settings", icon: Settings, label: "Configuración" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${activeView === item.id
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center"}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              {user.name[0]}
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex">
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard General</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 w-64 text-sm"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-8">
          <div className="p-6 space-y-8">
            {activeView === "dashboard" && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: "Ingresos Totales", value: `CLP ${((stats?.totalRevenue || 0) / 100).toLocaleString()}`, icon: DollarSign, trend: "+15%", color: "text-green-500", bg: "bg-green-500/10" },
                    { title: "Órdenes", value: stats?.totalOrders.toLocaleString(), icon: ShoppingBag, trend: "+8%", color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "Usuarios", value: stats?.totalUsers.toLocaleString(), icon: Users, trend: "+12%", color: "text-purple-500", bg: "bg-purple-500/10" },
                    { title: "Productos", value: stats?.totalProducts, icon: Package, trend: "+5%", color: "text-orange-500", bg: "bg-orange-500/10" },
                  ].map((stat, idx) => (
                    <Card key={idx} className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-900">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-2xl ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                          </div>
                          <Badge variant="outline" className={`border-none ${stat.bg} ${stat.color} flex items-center gap-1`}>
                            <TrendingUp className="w-3 h-3" />
                            {stat.trend}
                          </Badge>
                        </div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.title}</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 border-none shadow-lg bg-white dark:bg-gray-900">
                    <CardHeader>
                      <CardTitle>Resumen de Ingresos</CardTitle>
                      <CardDescription>Comportamiento de ventas en los últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData || []}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} tickFormatter={(value) => `$${value / 1000}k`} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-lg bg-white dark:bg-gray-900">
                    <CardHeader>
                      <CardTitle>Ventas por Categoría</CardTitle>
                      <CardDescription>Distribución actual</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {(categoryData || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">100%</span>
                            <p className="text-xs text-gray-500">Total</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        {(categoryData || []).map((cat: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                              <span className="text-gray-600 dark:text-gray-300">{cat.name}</span>
                            </div>
                            <span className="font-medium">{cat.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="orders" className="space-y-6">
                  <TabsList className="bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <TabsTrigger value="orders" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-lg">Órdenes Recientes</TabsTrigger>
                    <TabsTrigger value="sellers" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 rounded-lg">Solicitudes de Vendedores</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders">
                    <Card className="border-none shadow-lg bg-white dark:bg-gray-900 overflow-hidden">
                      <CardHeader>
                        <CardTitle>Últimas Transacciones</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Orden</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {recentOrders?.map((order: any) => (
                                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">{order.id.substring(0, 8)}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                                        U
                                      </div>
                                      <span className="text-gray-900 dark:text-gray-200">Usuario {order.userId.substring(0, 5)}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap font-medium">CLP ${(order.totalCents / 100).toLocaleString()}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge
                                      className={`
                                      ${order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'} 
                                      border-none shadow-none
                                    `}
                                    >
                                      {order.status === 'delivered' ? 'Entregado' : order.status === 'shipped' ? 'Enviado' : 'Pendiente'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="sellers">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pendingSellers?.length === 0 ? (
                        <div className="col-span-3 text-center py-12 text-gray-500">
                          No hay solicitudes pendientes.
                        </div>
                      ) : pendingSellers?.map((seller: any) => (
                        <Card key={seller.id} className="border-none shadow-lg bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 group">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-110 transition-transform">
                                {seller.displayName[0]}
                              </div>
                              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-100">Pendiente</Badge>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{seller.displayName}</h3>
                            <p className="text-sm text-gray-500 mb-4">{seller.description || "Sin descripción"}</p>

                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                              <Package className="w-4 h-4" />
                              <span>ID: {seller.id.substring(0, 8)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                                onClick={() => approveMutation.mutate(seller.id)}
                                disabled={approveMutation.isPending}
                              >
                                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                Aprobar
                              </Button>
                              <Button
                                variant="outline"
                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => rejectMutation.mutate(seller.id)}
                                disabled={rejectMutation.isPending}
                              >
                                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                                Rechazar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}

            {activeView === "users" && <UsersView />}
            {activeView === "products" && <ProductsView />}
            {activeView === "orders" && <OrdersView />}
            {activeView === "finances" && <FinancesView />}
            {activeView === "settings" && <SettingsView />}
          </div>
        </div>
      </main>
    </div>
  );
}