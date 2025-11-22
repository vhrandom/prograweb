import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Plus,
  Search,
  Bell,
  TrendingUp,
  DollarSign,
  Users,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon
} from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { LoadingScreen } from "@/components/ui/loading-screen";

import { regionsAndCities } from "@/lib/chile-data";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";

// --- Interfaces ---
interface Product {
  id: string;
  title: string;
  price: number; // priceCents
  stock: number;
  status: "active" | "out_of_stock" | "draft" | "inactive";
  sales: number;
  description?: string;
  categoryId?: string;
  sku?: string;
  images: string[];
  discountPercentage?: number;
  shippingCostCents?: number;
  isFreeShipping?: boolean;
}

interface SellerProfile {
  id: string;
  displayName: string;
  description?: string;
  location?: string;
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
}

interface Order {
  id: string;
  product: string;
  buyer: string;
  total: number;
  status: "pending" | "shipped" | "delivered" | "cancelled";
  date: string;
  createdAt?: number; // Assuming this exists or we use date
}

export default function SellerDashboard() {
  const { user, token, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("overview");

  // --- Data States ---
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewSeller, setIsNewSeller] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  // --- Form States ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    categoryId: "",
    description: "",
    price: "",
    sku: "",
    stock: "",
    discountPercentage: "",
    shippingCost: "",
    isFreeShipping: false,
    images: [] as string[],
  });

  // --- Edit States ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});

  // --- Location State ---
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const availableCities = useMemo(() => {
    return regionsAndCities.find(r => r.region === selectedRegion)?.cities || [];
  }, [selectedRegion]);

  // --- Load Data ---
  useEffect(() => {
    if (!user || !token) return;

    const loadData = async () => {
      try {
        const [statsRes, productsRes, ordersRes, profileRes] = await Promise.all([
          fetch('/api/seller/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/seller/products', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/seller/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/seller/profile', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statsRes.status === 404) {
          setIsNewSeller(true);
          setLoading(false);
          return;
        }

        if (!statsRes.ok || !productsRes.ok || !ordersRes.ok) throw new Error("Failed to load data");

        const statsData = await statsRes.json();
        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();
        const profileData = profileRes.ok ? await profileRes.json() : null;

        setStats(statsData);
        setProducts(productsData);
        setOrders(ordersData);
        setSellerProfile(profileData);

        if (profileData?.location) {
          const parts = profileData.location.split(",");
          if (parts.length >= 2) {
            // Try to match existing location format "City, Region"
            const city = parts[0].trim();
            const region = parts.slice(1).join(",").trim();
            // Verify if they exist in our data to set them correctly
            const regionExists = regionsAndCities.find(r => r.region === region);
            if (regionExists) {
              setSelectedRegion(region);
              setSelectedCity(city);
            }
          }
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudieron cargar los datos del panel.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, token, toast]);

  // --- Chart Data (Client-side Aggregation) ---
  const revenueData = useMemo(() => {
    // Group orders by date (last 7 days or so)
    // For demo, just mapping orders to a simple format
    // In a real app, you'd fill in missing dates
    const data = orders
      .filter(o => o.status !== 'cancelled')
      .slice(0, 10) // Limit to last 10 for demo
      .map(o => ({
        name: new Date(o.date || Date.now()).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
        total: o.total
      }))
      .reverse();
    return data.length ? data : [{ name: 'Hoy', total: 0 }];
  }, [orders]);

  // --- Handlers ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          discountPercentage: newProduct.discountPercentage ? parseInt(newProduct.discountPercentage) : 0,
          status: 'active',
          shippingCost: newProduct.isFreeShipping ? 0 : parseFloat(newProduct.price), // Fix: use shippingCost state
          isFreeShipping: newProduct.isFreeShipping
        })
      });
      if (!res.ok) throw new Error("Failed to create");

      const created = await res.json();
      setProducts([created, ...products]);
      setNewProduct({ title: "", categoryId: "", description: "", price: "", sku: "", stock: "", discountPercentage: "", shippingCost: "", isFreeShipping: false, images: [] });
      setActiveView("products");
      toast({ title: "Producto creado", description: "El producto se ha publicado exitosamente." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear el producto.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const res = await fetch(`/api/seller/products/${productToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed");
      toast({ title: "Producto eliminado" });
      setProducts(products.filter(p => p.id !== productToDelete));
      setProductToDelete(null);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar el producto.", variant: "destructive" });
    }
  };

  const handleCreateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/seller/profile', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.get('displayName'),
          description: formData.get('description'),
          location: `${selectedCity}, ${selectedRegion}`,
          status: 'verified'
        })
      });
      if (!res.ok) throw new Error("Failed");
      window.location.reload();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear el perfil.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const locationString = `${selectedCity}, ${selectedRegion}`;
      const res = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: formData.get('displayName'),
          description: formData.get('description'),
          location: locationString,
        })
      });

      if (!res.ok) throw new Error("Failed");
      const updatedProfile = await res.json();
      toast({ title: "Perfil actualizado" });
      setSellerProfile(updatedProfile);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    console.log('[DEBUG] Updating product ID:', editingProduct.id);
    console.log('[DEBUG] Form data:', editFormData);

    setIsSubmitting(true);
    try {
      const payload = {
        ...editFormData,
        price: editFormData.price ? parseFloat(editFormData.price.toString()) : undefined,
        stock: editFormData.stock ? parseInt(editFormData.stock.toString()) : undefined,
        discountPercentage: editFormData.discountPercentage ? parseInt(editFormData.discountPercentage.toString()) : 0,
        shippingCost: editFormData.isFreeShipping ? 0 : (editFormData.price ? parseFloat(editFormData.price.toString()) : 0),
        isFreeShipping: editFormData.isFreeShipping
      };
      console.log('[DEBUG] Payload:', payload);

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('[DEBUG] Update response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[DEBUG] Update failed:', errorData);
        throw new Error(errorData.message || "Failed to update");
      }

      const updated = await res.json();
      console.log('[DEBUG] Update successful:', updated);

      setProducts(products.map(p => p.id === updated.id ? updated : p));
      setEditingProduct(null);
      toast({ title: "Producto actualizado" });
    } catch (error) {
      console.error('[DEBUG] Update error:', error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo actualizar el producto.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (isNewSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white dark:bg-neutral-900">
          <CardHeader className="text-center space-y-2 pb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Bienvenido a la configuración de la tienda
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Configura tu tienda para comenzar a vender
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nombre de la Tienda</Label>
                <Input id="displayName" name="displayName" required placeholder="Ej: TechStore Chile" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Región</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una región" />
                    </SelectTrigger>
                    <SelectContent>
                      {regionsAndCities.map((r) => (
                        <SelectItem key={r.region} value={r.region}>
                          {r.region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una ciudad" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" name="description" required placeholder="Cuéntanos qué vendes..." />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Configurando..." : "Comenzar a Vender"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            SellerPanel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Button
            variant={activeView === "overview" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("overview")}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Resumen
          </Button>
          <Button
            variant={activeView === "products" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("products")}
          >
            <Package className="mr-2 h-4 w-4" />
            Productos
          </Button>
          <Button
            variant={activeView === "orders" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("orders")}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Órdenes
          </Button>
          <Button
            variant={activeView === "settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveView("settings")}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Button>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">
            {activeView === 'overview' ? 'Panel de Control' : activeView}
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
            <Button onClick={() => setActiveView("add-product")} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeView === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                      <h3 className="text-2xl font-bold mt-1">CLP ${(stats?.totalRevenue ?? 0).toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Órdenes Totales</p>
                      <h3 className="text-2xl font-bold mt-1">{stats?.totalOrders ?? 0}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Productos Activos</p>
                      <h3 className="text-2xl font-bold mt-1">{stats?.totalProducts ?? 0}</h3>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pendientes</p>
                      <h3 className="text-2xl font-bold mt-1">{stats?.pendingOrders ?? 0}</h3>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <Bell className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Resumen de Ventas</CardTitle>
                    <CardDescription>Ingresos de los últimos días</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Órdenes Recientes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-900 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                              <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-white truncate max-w-[120px]">{order.product}</p>
                              <p className="text-xs text-gray-500">{order.buyer}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">CLP ${order.total.toLocaleString()}</p>
                            <span className={`text-[10px] px-2 py-1 rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && <p className="text-center text-gray-500 text-sm">No hay órdenes recientes</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeView === "products" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Inventario</CardTitle>
                  <CardDescription>Gestiona tus productos y stock</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input placeholder="Buscar productos..." className="pl-8" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-neutral-800 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-neutral-900">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{product.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-medium text-blue-600">CLP ${((product.price ?? 0) / 100).toLocaleString()}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">Stock: {product.stock}</span>
                            {product.discountPercentage && product.discountPercentage > 0 && (
                              <Badge variant="destructive" className="text-[10px] h-5">{product.discountPercentage}% OFF</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                          {product.status}
                        </Badge>
                        <Button variant="ghost" size="icon" onClick={() => {
                          console.log('[DEBUG] Editing product:', product);
                          console.log('[DEBUG] Product ID:', product.id, 'Type:', typeof product.id);
                          setEditingProduct(product);
                          setEditFormData({
                            title: product.title,
                            description: product.description,
                            price: product.price / 100,
                            categoryId: product.categoryId,
                            stock: product.stock,
                            sku: product.sku,
                            discountPercentage: product.discountPercentage || 0,
                            images: product.images || [],
                            isFreeShipping: product.isFreeShipping || false
                          });
                          console.log('[DEBUG] Edit form data set:', {
                            title: product.title,
                            price: product.price / 100,
                            isFreeShipping: product.isFreeShipping
                          });
                        }}>
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <AlertDialog open={productToDelete === product.id} onOpenChange={(open) => !open && setProductToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setProductToDelete(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el producto "{product.title}" de tu inventario.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-500 hover:bg-red-600 text-white">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeView === "add-product" && (
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle>Agregar Nuevo Producto</CardTitle>
                <CardDescription>Completa la información para publicar tu producto</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={newProduct.title}
                        onChange={e => setNewProduct({ ...newProduct, title: e.target.value })}
                        required
                        placeholder="Ej: MacBook Pro M3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoría</Label>
                      <Select onValueChange={v => setNewProduct({ ...newProduct, categoryId: v })}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smartphones">Smartphones</SelectItem>
                          <SelectItem value="laptops">Laptops</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="gaming">Gaming</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Precio (CLP)</Label>
                      <Input
                        type="number"
                        value={newProduct.price}
                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                        required
                        placeholder="999990"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={newProduct.stock}
                        onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                        required
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discountPercentage">Descuento (%)</Label>
                      <Input id="discountPercentage" type="number" value={newProduct.discountPercentage} onChange={(e) => setNewProduct({ ...newProduct, discountPercentage: e.target.value })} placeholder="0" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isFreeShipping"
                      checked={newProduct.isFreeShipping}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, isFreeShipping: checked as boolean })}
                    />
                    <Label htmlFor="isFreeShipping">Envío gratis</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="images">Imágenes</Label>
                    <ImageUpload
                      value={newProduct.images}
                      onChange={urls => setNewProduct({ ...newProduct, images: urls })}
                      maxImages={5}
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => setActiveView("products")}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Publicando..." : "Publicar Producto"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeView === "orders" && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Órdenes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{order.product}</p>
                        <p className="text-sm text-gray-500">Comprador: {order.buyer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">CLP ${order.total.toLocaleString()}</p>
                        <Badge>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="text-center text-gray-500">No hay órdenes.</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {activeView === "settings" && sellerProfile && (
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Configuración de la Tienda</CardTitle>
                <CardDescription>Actualiza la información de tu negocio</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nombre de la Tienda</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      defaultValue={sellerProfile.displayName}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Región</Label>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una región" />
                        </SelectTrigger>
                        <SelectContent>
                          {regionsAndCities.map((r) => (
                            <SelectItem key={r.region} value={r.region}>
                              {r.region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ciudad</Label>
                      <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedRegion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={sellerProfile.description}
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

        </div>

        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={editFormData.title || ""}
                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio (CLP)</Label>
                  <Input
                    type="number"
                    value={editFormData.price || ""}
                    onChange={e => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={editFormData.stock || ""}
                    onChange={e => setEditFormData({ ...editFormData, stock: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    value={editFormData.discountPercentage || 0}
                    onChange={e => setEditFormData({ ...editFormData, discountPercentage: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="editIsFreeShipping"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={editFormData.isFreeShipping || false}
                    onChange={e => setEditFormData({ ...editFormData, isFreeShipping: e.target.checked })}
                  />
                  <Label htmlFor="editIsFreeShipping">Envío Gratis</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>Guardar Cambios</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}