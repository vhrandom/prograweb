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
  ChevronRight,
  Edit,
  Trash2,
  Image as ImageIcon,
  Tag,
  Store,
  Barcode
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
import { Separator } from "@/components/ui/separator";

// --- Constantes ---
const CATEGORIES = [
  { value: "smartphones", label: "Smartphones" },
  { value: "laptops", label: "Laptops" },
  { value: "tablets", label: "Tablets" },
  { value: "audio", label: "Audio" },
  { value: "smartwatch", label: "Smartwatch" },
  { value: "gaming", label: "Gaming" },
];

const BRANDS = [
  { value: "Apple", label: "Apple" },
  { value: "Samsung", label: "Samsung" },
  { value: "NVIDIA", label: "NVIDIA" },
  { value: "Sony", label: "Sony" },
  { value: "Generico", label: "Genérico" },
];

// --- Interfaces ---
interface Product {
  id: string;
  title: string;
  price: number; 
  stock: number;
  status: "active" | "out_of_stock" | "draft" | "inactive";
  sales: number;
  description?: string;
  categoryId?: string;
  brand?: string;
  sku?: string;
  images: string[];
  discountPercentage?: number;
  shippingCostCents?: number;
  shippingCost?: number;
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
  createdAt?: number;
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
    brand: "",
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
            const city = parts[0].trim();
            const region = parts.slice(1).join(",").trim();
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

  // --- Chart Data ---
  const revenueData = useMemo(() => {
    const data = orders
      .filter(o => o.status !== 'cancelled')
      .slice(0, 10)
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
          shippingCost: newProduct.isFreeShipping ? 0 : (newProduct.shippingCost ? parseFloat(newProduct.shippingCost) : 0),
          isFreeShipping: newProduct.isFreeShipping
        })
      });
      if (!res.ok) throw new Error("Failed to create");

      const created = await res.json();
      setProducts([created, ...products]);
      setNewProduct({ title: "", categoryId: "", brand: "", description: "", price: "", sku: "", stock: "", discountPercentage: "", shippingCost: "", isFreeShipping: false, images: [] });
      setActiveView("products");
      toast({ title: "Producto creado", description: "El producto se ha publicado exitosamente." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo crear el producto.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id?: string) => {
    const targetId = id || productToDelete;
    if (!targetId) return;

    try {
      const res = await fetch(`/api/products/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Failed");
      toast({ title: "Producto eliminado" });
      setProducts(products.filter(p => p.id !== targetId));
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

    setIsSubmitting(true);
    try {
      const payload = {
        ...editFormData,
        price: editFormData.price ? parseFloat(editFormData.price.toString()) : undefined,
        stock: editFormData.stock ? parseInt(editFormData.stock.toString()) : undefined,
        discountPercentage: editFormData.discountPercentage ? parseInt(editFormData.discountPercentage.toString()) : 0,
        shippingCost: editFormData.isFreeShipping ? 0 : (editFormData.shippingCost !== undefined ? parseFloat(editFormData.shippingCost.toString()) : 0),
        isFreeShipping: editFormData.isFreeShipping
      };

      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to update");

      const updated = await res.json();
      setProducts(products.map(p => p.id === updated.id ? updated : p));
      setEditingProduct(null);
      toast({ title: "Producto actualizado" });
    } catch (error) {
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

  // --- ESTILOS DE INPUTS REFINADOS ---
  // Modo Claro: Fondo blanco, borde gris sutil, sombra suave (mucho más limpio que el gris).
  // Modo Oscuro: Fondo oscuro, borde oscuro sutil.
  const inputClass = "h-11 bg-white border border-gray-200 text-gray-900 text-sm rounded-lg shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/10";
  
  const labelClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-neutral-300";

  if (isNewSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4">
        <Card className="w-full max-w-lg shadow-xl border-0 bg-white dark:bg-neutral-900 rounded-2xl">
          <CardHeader className="text-center space-y-2 pb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Bienvenido a tu Tienda
            </CardTitle>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Configura tu perfil para comenzar a vender
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className={labelClass}>Nombre de la Tienda</Label>
                <Input id="displayName" name="displayName" required placeholder="Ej: TechStore Chile" className={inputClass} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className={labelClass}>Región</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Selecciona una región" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                      {regionsAndCities.map((r) => (
                        <SelectItem key={r.region} value={r.region}>{r.region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Ciudad</Label>
                  <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedRegion}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Selecciona una ciudad" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className={labelClass}>Descripción</Label>
                <Textarea id="description" name="description" required placeholder="Cuéntanos qué vendes..." className={`${inputClass} min-h-[100px] resize-none pt-3`} />
              </div>
              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                {isSubmitting ? "Configurando..." : "Comenzar a Vender"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50/50 dark:bg-neutral-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 hidden md:flex flex-col shadow-sm z-10">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Seller<span className="text-blue-600">Panel</span>
            </h2>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">Menu</p>
            <Button
              variant={activeView === "overview" ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 ${activeView === "overview" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"}`}
              onClick={() => setActiveView("overview")}
            >
              <LayoutDashboard className="mr-3 h-4 w-4" />
              Resumen
            </Button>
            <Button
              variant={activeView === "products" ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 ${activeView === "products" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"}`}
              onClick={() => setActiveView("products")}
            >
              <Package className="mr-3 h-4 w-4" />
              Productos
            </Button>
            <Button
              variant={activeView === "orders" ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 ${activeView === "orders" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"}`}
              onClick={() => setActiveView("orders")}
            >
              <ShoppingCart className="mr-3 h-4 w-4" />
              Órdenes
            </Button>
            <Button
              variant={activeView === "settings" ? "secondary" : "ghost"}
              className={`w-full justify-start h-10 ${activeView === "settings" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" : "dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"}`}
              onClick={() => setActiveView("settings")}
            >
              <Settings className="mr-3 h-4 w-4" />
              Configuración
            </Button>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-neutral-800/50 mb-2">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{sellerProfile?.displayName || "Vendedor"}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-9" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-8 sticky top-0 z-20">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white capitalize flex items-center gap-2">
            {activeView === 'overview' && 'Panel de Control'}
            {activeView === 'products' && 'Inventario'}
            {activeView === 'orders' && 'Gestión de Órdenes'}
            {activeView === 'add-product' && <><span onClick={() => setActiveView("products")} className="cursor-pointer hover:underline text-gray-500 dark:text-neutral-400 font-normal">Inventario</span> <ChevronRight className="w-4 h-4 text-gray-400" /> Nuevo Producto</>}
            {activeView === 'settings' && 'Configuración de Tienda'}
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full border-gray-200 hover:bg-gray-100 relative dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700">
              <Bell className="h-5 w-5 text-gray-600 dark:text-neutral-400" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
            </Button>
            {activeView === 'products' && (
              <Button onClick={() => setActiveView("add-product")} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 dark:shadow-none rounded-lg px-6">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
          {activeView === "overview" && (
            <div className="space-y-8 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Ingresos Totales", value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50", borderColor: "border-green-100" },
                  { title: "Órdenes Totales", value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50", borderColor: "border-blue-100" },
                  { title: "Productos Activos", value: stats?.totalProducts ?? 0, icon: Package, color: "text-purple-600", bg: "bg-purple-50", borderColor: "border-purple-100" },
                  { title: "Pendientes", value: stats?.pendingOrders ?? 0, icon: Bell, color: "text-orange-600", bg: "bg-orange-50", borderColor: "border-orange-100" },
                ].map((stat, i) => (
                  <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-neutral-900 ring-1 ring-gray-100 dark:ring-neutral-800">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.title}</p>
                        <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value}</h3>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} dark:bg-opacity-10`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-gray-100 dark:ring-neutral-800">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-white">Tendencia de Ventas</CardTitle>
                    <CardDescription className="dark:text-neutral-400">Visualiza el rendimiento de tus ventas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" className="dark:stroke-neutral-800" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-gray-100 dark:ring-neutral-800">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-white">Órdenes Recientes</CardTitle>
                    <CardDescription className="dark:text-neutral-400">Últimas transacciones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {orders.slice(0, 5).map((order) => (
                        <div key={order.id} className="flex items-start justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                              <ShoppingCart className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate max-w-[140px]">{order.product}</p>
                              <p className="text-xs text-gray-500 dark:text-neutral-400">{order.buyer}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm dark:text-neutral-200">CLP ${(order.total).toLocaleString()}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                              {order.status === 'pending' ? 'Pendiente' : order.status === 'delivered' ? 'Entregado' : order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p>No hay ventas recientes</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeView === "products" && (
            <div className="max-w-7xl mx-auto space-y-6">
              <Card className="border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-gray-100 dark:ring-neutral-800">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg dark:text-white">Listado de Productos</CardTitle>
                    <CardDescription className="dark:text-neutral-400">Gestiona el inventario de tu tienda</CardDescription>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-neutral-500" />
                    <Input placeholder="Buscar por nombre o SKU..." className={`${inputClass} pl-9`} />
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                {products.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 dark:bg-neutral-900 dark:border-neutral-800">
                    <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-neutral-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Tu inventario está vacío</h3>
                    <p className="text-gray-500 dark:text-neutral-400 mb-6">Comienza agregando tu primer producto</p>
                    <Button onClick={() => setActiveView("add-product")} className="bg-indigo-600">
                      <Plus className="mr-2 h-4 w-4" /> Agregar Producto
                    </Button>
                  </div>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="group flex flex-col sm:flex-row items-center gap-6 p-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl hover:shadow-lg transition-all duration-300 hover:border-indigo-100 dark:hover:border-indigo-900/30">
                      <div className="relative w-full sm:w-24 h-24 rounded-lg bg-gray-50 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-neutral-600">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 w-full text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{product.title}</h3>
                          {product.brand && (
                            <Badge variant="outline" className="w-fit mx-auto sm:mx-0 text-xs font-normal text-gray-500 dark:text-neutral-400 border-gray-200 dark:border-neutral-700">
                              {product.brand}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span className="capitalize">{product.categoryId || 'Sin categoría'}</span>
                          </div>
                          <span>•</span>
                          <span>Stock: <span className={product.stock < 5 ? "text-red-500 font-medium" : "text-gray-700 dark:text-neutral-300 font-medium"}>{product.stock}</span></span>
                          <span>•</span>
                          <span>SKU: {product.sku ? product.sku : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-1 text-right min-w-[120px]">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                          ${((product.price ?? 0) / 100).toLocaleString('es-CL')}
                        </span>
                        {product.discountPercentage && product.discountPercentage > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                            -{product.discountPercentage}%
                          </Badge>
                        )}
                      </div>

                      <div className="flex sm:flex-col gap-2 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-neutral-800 pt-4 sm:pt-0 sm:pl-4 w-full sm:w-auto justify-center">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400" onClick={() => {
                          setEditingProduct(product);
                          setEditFormData({
                            title: product.title,
                            description: product.description,
                            price: product.price / 100,
                            categoryId: product.categoryId,
                            brand: product.brand,
                            stock: product.stock,
                            sku: product.sku,
                            discountPercentage: product.discountPercentage || 0,
                            images: product.images || [],
                            shippingCost: product.isFreeShipping ? 0 : (product.shippingCost ? product.shippingCost / 100 : 0),
                            isFreeShipping: product.isFreeShipping || false
                          });
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog open={productToDelete === product.id} onOpenChange={(open) => !open && setProductToDelete(null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400" onClick={() => setProductToDelete(product.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="dark:bg-neutral-900 dark:border-neutral-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="dark:text-white">¿Eliminar producto?</AlertDialogTitle>
                              <AlertDialogDescription className="dark:text-neutral-400">
                                Esta acción eliminará "{product.title}" permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-red-600">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeView === "add-product" && (
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-lg bg-white dark:bg-neutral-900 ring-1 ring-gray-100 dark:ring-neutral-800">
                <CardHeader className="border-b border-gray-100 dark:border-neutral-800 pb-6">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
                    <Package className="w-5 h-5" />
                    <span className="text-sm font-semibold uppercase tracking-wider">Inventario</span>
                  </div>
                  <CardTitle className="text-2xl dark:text-white">Nuevo Producto</CardTitle>
                  <CardDescription className="dark:text-neutral-400">Completa la información detallada para publicar tu producto en el marketplace.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <form onSubmit={handleCreateProduct} className="space-y-8">
                    {/* Sección 1: Información Básica */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-l-4 border-indigo-500 pl-3">Información Básica</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                          <Label className={labelClass}>Título del Producto</Label>
                          <Input
                            value={newProduct.title}
                            onChange={e => setNewProduct({ ...newProduct, title: e.target.value })}
                            required
                            placeholder="Ej: MacBook Pro M3 Max 16 Pulgadas"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>Categoría</Label>
                          <Select onValueChange={v => setNewProduct({ ...newProduct, categoryId: v })}>
                            <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>Marca</Label>
                          <Select onValueChange={v => setNewProduct({ ...newProduct, brand: v })}>
                            <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar Marca..." /></SelectTrigger>
                            <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                              {BRANDS.map(brand => (
                                <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={labelClass}>Descripción</Label>
                        <Textarea
                          value={newProduct.description}
                          onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                          className={`${inputClass} min-h-[120px] resize-none pt-3`}
                          placeholder="Describe las características principales, estado y detalles técnicos..."
                        />
                      </div>
                    </div>

                    <Separator className="dark:bg-neutral-800" />

                    {/* Sección 2: Precios e Inventario */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-l-4 border-indigo-500 pl-3">Precios e Inventario</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label className={labelClass}>Precio (CLP)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              value={newProduct.price}
                              onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                              required
                              placeholder="0"
                              className={`${inputClass} pl-9`}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>Stock Disponible</Label>
                          <Input
                            type="number"
                            value={newProduct.stock}
                            onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                            required
                            placeholder="0"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className={labelClass}>SKU (Código)</Label>
                          <div className="relative">
                            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              value={newProduct.sku}
                              onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                              required
                              placeholder="COD-001"
                              className={`${inputClass} pl-9`}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="discountPercentage" className={labelClass}>Descuento (%)</Label>
                          <Input
                            id="discountPercentage"
                            type="number"
                            value={newProduct.discountPercentage}
                            onChange={(e) => setNewProduct({ ...newProduct, discountPercentage: e.target.value })}
                            placeholder="0"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-neutral-800/30 rounded-lg flex items-center space-x-3 border border-gray-100 dark:border-neutral-800">
                        <Checkbox
                          id="isFreeShipping"
                          checked={newProduct.isFreeShipping}
                          onCheckedChange={(checked) => setNewProduct({ ...newProduct, isFreeShipping: checked as boolean })}
                          className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label htmlFor="isFreeShipping" className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-neutral-200`}>
                            Envío Gratis
                          </Label>
                          <p className="text-xs text-gray-500 dark:text-neutral-400">
                            Si se activa, el costo de envío será $0 para el comprador.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="dark:bg-neutral-800" />

                    {/* Sección 3: Multimedia */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white border-l-4 border-indigo-500 pl-3">Galería de Imágenes</h3>
                      <div className="space-y-2">
                        <Label className={labelClass}>Sube hasta 5 imágenes</Label>
                        <div className="bg-gray-50 dark:bg-neutral-800/30 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
                          <ImageUpload
                            value={newProduct.images}
                            onChange={urls => setNewProduct({ ...newProduct, images: urls })}
                            maxImages={5}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6">
                      <Button type="button" variant="outline" className="h-11 px-8 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800" onClick={() => setActiveView("products")}>
                        Cancelar
                      </Button>
                      <Button type="submit" className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none" disabled={isSubmitting}>
                        {isSubmitting ? "Publicando..." : "Publicar Producto"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeView === "orders" && (
            <Card className="max-w-7xl mx-auto border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-gray-100 dark:ring-neutral-800">
              <CardHeader>
                <CardTitle className="dark:text-white">Historial de Órdenes</CardTitle>
                <CardDescription className="dark:text-neutral-400">Revisa el estado de tus ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-100 dark:border-neutral-800 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-neutral-800/50 px-4 py-3 border-b border-gray-100 dark:border-neutral-800 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    <div className="col-span-4">Producto</div>
                    <div className="col-span-3">Comprador</div>
                    <div className="col-span-2">Fecha</div>
                    <div className="col-span-2 text-right">Total</div>
                    <div className="col-span-1 text-center">Estado</div>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-neutral-800">
                    {orders.map((order) => (
                      <div key={order.id} className="px-4 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors text-sm">
                        <div className="col-span-4 font-medium text-gray-900 dark:text-white">{order.product}</div>
                        <div className="col-span-3 text-gray-600 dark:text-neutral-400">{order.buyer}</div>
                        <div className="col-span-2 text-gray-500 dark:text-neutral-500 text-xs">
                          {new Date(order.date || Date.now()).toLocaleDateString()}
                        </div>
                        <div className="col-span-2 text-right font-semibold text-gray-900 dark:text-white">
                          ${order.total.toLocaleString()}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <Badge variant="secondary" className={`text-[10px] ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="py-12 text-center text-gray-500 dark:text-neutral-500">No hay historial de órdenes disponible.</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeView === "settings" && sellerProfile && (
            <Card className="max-w-2xl mx-auto border-0 shadow-sm bg-white dark:bg-neutral-900 ring-1 ring-gray-100 dark:ring-neutral-800">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Settings className="w-5 h-5 text-indigo-600" />
                  </div>
                  <CardTitle className="dark:text-white">Configuración de la Tienda</CardTitle>
                </div>
                <CardDescription className="dark:text-neutral-400">Actualiza la información visible para tus clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className={labelClass}>Nombre de la Tienda</Label>
                    <Input
                      id="displayName"
                      name="displayName"
                      defaultValue={sellerProfile.displayName}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={labelClass}>Región</Label>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                          {regionsAndCities.map((r) => (
                            <SelectItem key={r.region} value={r.region}>{r.region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Ciudad</Label>
                      <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedRegion}>
                        <SelectTrigger className={inputClass}><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                        <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className={labelClass}>Descripción Pública</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={sellerProfile.description}
                      className={`${inputClass} min-h-[120px] resize-none pt-3`}
                    />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white">
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Modal */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-neutral-900 dark:border-neutral-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Editar Producto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateProduct} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label className={labelClass}>Título</Label>
                  <Input
                    value={editFormData.title || ""}
                    onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Categoría</Label>
                  <Select
                    value={editFormData.categoryId}
                    onValueChange={v => setEditFormData({ ...editFormData, categoryId: v })}
                  >
                    <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Marca</Label>
                  <Select
                    value={editFormData.brand}
                    onValueChange={v => setEditFormData({ ...editFormData, brand: v })}
                  >
                    <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar Marca..." /></SelectTrigger>
                    <SelectContent className="bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700">
                      {BRANDS.map(brand => (
                        <SelectItem key={brand.value} value={brand.value}>{brand.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className={labelClass}>Precio (CLP)</Label>
                  <Input
                    type="number"
                    value={editFormData.price || ""}
                    onChange={e => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>Stock</Label>
                  <Input
                    type="number"
                    value={editFormData.stock || ""}
                    onChange={e => setEditFormData({ ...editFormData, stock: parseInt(e.target.value) })}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClass}>SKU</Label>
                  <Input
                    value={editFormData.sku || ""}
                    onChange={e => setEditFormData({ ...editFormData, sku: e.target.value })}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className={labelClass}>Descuento (%)</Label>
                  <Input
                    type="number"
                    value={editFormData.discountPercentage || 0}
                    onChange={e => setEditFormData({ ...editFormData, discountPercentage: parseInt(e.target.value) })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="editIsFreeShipping"
                  checked={editFormData.isFreeShipping || false}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, isFreeShipping: checked as boolean })}
                  className="data-[state=checked]:bg-indigo-600"
                />
                <Label htmlFor="editIsFreeShipping" className={labelClass}>Envío Gratis</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)} className="dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">Guardar Cambios</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}