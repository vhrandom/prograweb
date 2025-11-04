import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth"; // Asegúrate que esto te da { user, token }
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "@/components/ui/dialog"; // Importar el Modal
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

// --- Interfaces ---
// Esta interfaz ahora coincide con lo que la API (modificada) devuelve
interface Product {
  id: string;
  title: string;
  price: number; // Esto será priceCents (ej: 129990)
  stock: number;
  status: "active" | "out_of_stock" | "draft" | "inactive";
  sales: number;
  description?: string;
  categoryId?: string;
  sku?: string;
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
}
// ---

export default function SellerDashboard() {
  const { user, token } = useAuth(); // Necesitas el token de tu hook
  const [activeTab, setActiveTab] = useState("overview");

  // --- Estados de Datos ---
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  // --- Estados de UI ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false); // Flag para evitar bucles

  // --- Estados del Formulario (Agregar) ---
  const [newProduct, setNewProduct] = useState({
    title: "",
    categoryId: "",
    description: "",
    price: "", // El usuario ingresa el precio en pesos (ej: 1299.90)
    sku: "",
    stock: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // --- Estados del Modal (Editar) ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Product>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // --- 1. Lógica de Carga de Datos ---
  useEffect(() => {
    if (!user || !token) {
      setLoading(false);
      setError("Usuario no autenticado.");
      return;
    }
    if (hasLoaded) {
      return;
    }
    
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      const authHeaders = { 'Authorization': `Bearer ${token}` };

      try {
        const [statsRes, productsRes, ordersRes] = await Promise.all([
          fetch('/api/seller/stats', { headers: authHeaders }),
          fetch('/api/seller/products', { headers: authHeaders }),
          fetch('/api/seller/orders', { headers: authHeaders })
        ]);

        if (!statsRes.ok || !productsRes.ok || !ordersRes.ok) {
          throw new Error('No se pudieron cargar uno o más recursos del panel.');
        }

        const statsData: Stats = await statsRes.json();
        const productsData: Product[] = await productsRes.json();
        const ordersData: Order[] = await ordersRes.json();

        setStats(statsData);
        setProducts(productsData);
        setAllOrders(ordersData);
        setRecentOrders(ordersData.slice(0, 3)); 
        setHasLoaded(true);

      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("Ocurrió un error inesperado.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user, token, hasLoaded]);

  // --- 2. Lógica del Formulario (Agregar Producto) ---
  // (Esta función coincide con tu backend 'routes.ts' actualizado)
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setNewProduct(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setNewProduct(prev => ({ ...prev, categoryId: value }));
  };

  const handleCreateProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Prepara los datos para enviar
      // 'price' se envía como pesos (ej: "1299.90")
      // tu API 'routes.ts' lo convertirá a centavos
      const productData = {
        title: newProduct.title,
        description: newProduct.description,
        categoryId: newProduct.categoryId,
        price: parseFloat(newProduct.price), // Envía como número
        sku: newProduct.sku,
        stock: parseInt(newProduct.stock, 10),
        status: "active"
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el producto.");
      }

      const createdProduct = await response.json();
      setProducts(currentProducts => [createdProduct, ...currentProducts]);
      setNewProduct({ title: "", categoryId: "", description: "", price: "", sku: "", stock: "" });
      setActiveTab("products");

    } catch (err) {
      if (err instanceof Error) setFormError(err.message);
      else setFormError("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. Lógica de Acciones (Eliminar Producto) ---
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("¿Estás seguro?")) return;
    if (!token) return;
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("No se pudo eliminar el producto.");
      setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
    } catch (err) {
      if (err instanceof Error) alert(`Error: ${err.message}`);
    }
  };

  // --- 4. Lógica del Modal (Editar Producto) ---
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    // 'product.price' viene en centavos, lo convertimos a pesos para el input
    setEditFormData({ ...product, price: (product.price ?? 0) / 100 });
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setEditFormData({});
    setIsUpdating(false);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleUpdateProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProduct || !token) return;
    setIsUpdating(true);
    
    // 'editFormData.price' está en pesos, pero la API espera
    // los campos del 'Product' (no de la variante, según tu routes.ts)
    const updateData = {
      ...editFormData,
      price: parseFloat(String(editFormData.price)),
      stock: parseInt(String(editFormData.stock), 10),
    };

    try {
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error("No se pudo actualizar el producto.");

      const updatedProduct = await response.json();
      setProducts(currentProducts =>
        currentProducts.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      closeEditModal();
    } catch (err) {
      if (err instanceof Error) alert(`Error: ${err.message}`);
      setIsUpdating(false);
    }
  };

  // --- Renderizado ---
  if (user?.role !== 'seller') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card><CardContent className="pt-6">
          <p className="text-center text-red-600">Acceso denegado.</p>
        </CardContent></Card>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Cargando panel...</div>;
  }
  if (error) {
    return <div className="container mx-auto px-4 py-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Vendedor</h1>
        <p className="text-gray-600">Bienvenido, {user.name}</p>
      </div>

      {/* Stats Cards (Tu código con '?? 0' está bien) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* ... (Tus 4 <Card> de stats están bien) ... */}
         <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CLP ${(stats?.totalRevenue ?? 0).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingOrders ?? 0}</div>
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

        {/* --- Pestaña Resumen --- */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Órdenes Recientes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{order.product}</p>
                        <p className="text-xs text-gray-600">{order.buyer}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">CLP ${order.total.toLocaleString()}</p>
                        <Badge variant={order.status === 'delivered' ? 'default' : 'outline'}>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Productos Top</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.slice(0, 3).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{product.title}</p>
                        <p className="text-xs text-gray-600">{product.sales ?? 0} ventas</p>
                      </div>
                      <div className="text-right">
                        {/* --- ¡CORRECCIÓN DE SEGURIDAD! --- */}
                        {/* 'price' viene en centavos, lo convertimos y usamos ?? 0 */}
                        <p className="font-medium text-sm">CLP ${((product.price ?? 0) / 100).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock ?? 0}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- Pestaña Productos --- */}
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
                      {/* --- ¡CORRECCIÓN DE SEGURIDAD! --- */}
                      <p className="text-sm text-gray-600">CLP ${((product.price ?? 0) / 100).toLocaleString()}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={product.status === 'active' ? 'default' : 'destructive'}>
                          {product.status}
                        </Badge>
                        <span className="text-sm text-gray-500">Stock: {product.stock ?? 0}</span>
                        <span className="text-sm text-gray-500">Ventas: {product.sales ?? 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditModal(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Pestaña Órdenes --- */}
        <TabsContent value="orders">
          <Card>
            <CardHeader><CardTitle>Todas las Órdenes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    {/* ... (Tu JSX de Órdenes está bien) ... */}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- Pestaña Agregar Producto --- */}
        <TabsContent value="add-product">
          <Card>
            <CardHeader><CardTitle>Agregar Nuevo Producto</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleCreateProduct}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del Producto</Label>
                    <Input id="title" value={newProduct.title} onChange={handleFormChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={newProduct.categoryId} onValueChange={handleSelectChange} required>
                      <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smartphones">Smartphones</SelectItem>
                        <SelectItem value="laptops">Laptops</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea id="description" value={newProduct.description} onChange={handleFormChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (CLP)</Label>
                    {/* El usuario ingresa pesos (ej: 1299.90) */}
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="1299.90" 
                      step="0.01"
                      value={newProduct.price} 
                      onChange={handleFormChange} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" value={newProduct.sku} onChange={handleFormChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Inicial</Label>
                    <Input id="stock" type="number" placeholder="10" value={newProduct.stock} onChange={handleFormChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  {/* ... (Tu input de imágenes) ... */}
                </div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex gap-4">
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? "Creando..." : "Crear Producto"}
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

      {/* --- Modal de Edición --- */}
      <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && closeEditModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto: {editingProduct?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={editFormData.title || ""}
                onChange={handleEditFormChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio (CLP)</Label>
                {/* Lee centavos y los muestra como pesos */}
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={editFormData.price ?? 0} // 'price' en el estado de edición ya está en pesos
                  onChange={handleEditFormChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={editFormData.stock || ""}
                  onChange={handleEditFormChange}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}