import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Cpu, Smartphone, Gamepad2, Headphones, Home as HomeIcon, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const searchQuery = searchParams.get("search") || "";

  const [categoryId, setCategoryId] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [brand, setBrand] = useState("all");
  const [shipping, setShipping] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [limit, setLimit] = useState(20);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products", { search: searchQuery, category: categoryId, priceRange, brand, shipping, sortBy, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (categoryId !== "all") params.append("category", categoryId);
      // Translate priceRange into minPrice / maxPrice for backend filtering
      if (priceRange !== "all") {
        if (priceRange === "0-50000") {
          params.append("minPrice", "0");
          params.append("maxPrice", "50000");
        } else if (priceRange === "50000-200000") {
          params.append("minPrice", "50000");
          params.append("maxPrice", "200000");
        } else if (priceRange === "200000+") {
          params.append("minPrice", "200000");
        }
      }
      if (brand !== "all") params.append("brand", brand);
      if (shipping !== "all") params.append("shipping", shipping);
      if (sortBy !== "featured") params.append("sort", sortBy);
      params.append("limit", limit.toString());

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const quickFilters = [
    { icon: Cpu, label: "💻 Computación", filter: "computacion" },
    { icon: Smartphone, label: "📱 Smartphones", filter: "smartphones" },
    { icon: Gamepad2, label: "🎮 Gaming", filter: "gaming" },
    { icon: Headphones, label: "🎧 Audio", filter: "audio" },
    { icon: HomeIcon, label: "🏠 Smart Home", filter: "smart-home" },
    { icon: Truck, label: "🚚 Envío Gratis", filter: "free-shipping" },
  ];

  const handleProductView = (productId: string) => {
    console.log('[Home] Navigating to product ID:', productId);
    setLocation(`/product/${productId}`);
  };

  const floatingIcons = [
    { icon: Cpu, className: "top-20 left-10 w-12 h-12 bg-gradient-to-br from-tech-blue to-apple-blue", delay: "0s" },
    { icon: Smartphone, className: "top-32 right-16 w-10 h-10 bg-gradient-to-br from-tech-green to-apple-green", delay: "1s" },
    { icon: Headphones, className: "bottom-20 right-20 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500", delay: "2s" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-apple-gray-6 to-white dark:from-apple-dark-1 dark:to-black">
        <div className="gradient-mesh absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center animate-fade-in">
            <h1 className="text-display-large bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-6">
              El futuro de la tecnología <br />en tus manos
            </h1>
            <p className="text-title-3 text-apple-gray-1 dark:text-apple-gray-2 mb-8 max-w-2xl mx-auto">
              Descubre los productos más innovadores con la mejor experiencia de compra. Vendedores verificados, envíos seguros y garantía total.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => {
                  // Redirect to public products page
                  window.location.href = "http://localhost:5000/products";
                }}
                className="button-haptic px-8 py-4 bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-5 shadow-apple-lg hover:shadow-glow-blue transition-all duration-200"
              >
                Explorar Productos
              </Button>
              <Button
                onClick={() => {
                  if (!isAuthenticated) {
                    // Not logged in – go to registration / login page
                    window.location.href = "http://localhost:5000/auth";
                  } else if (isAuthenticated && user?.role === "seller") {
                    // Seller – go to dashboard
                    window.location.href = "http://localhost:5000/seller/dashboard";
                  } else {
                    // Buyer – show message and redirect to seller registration
                    toast({
                      title: "Registro Requerido",
                      description: "Para vender en Silicon Trail, necesitas una cuenta de vendedor.",
                    });
                    setTimeout(() => {
                      window.location.href = "http://localhost:5000/auth";
                    }, 1500);
                  }
                }}
                variant="outline"
                className="button-haptic px-8 py-4 bg-white dark:bg-apple-dark-2 text-apple-blue dark:text-apple-blue-dark border-apple-blue dark:border-apple-blue-dark hover:bg-apple-blue hover:text-white dark:hover:bg-apple-blue-dark transition-all duration-200"
              >
                Vender en Silicon Trail
              </Button>
            </div>
          </div>
        </div>

        {/* Floating Tech Icons */}
        {floatingIcons.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`absolute ${item.className} rounded-xl flex items-center justify-center animate-float opacity-30`}
              style={{ animationDelay: item.delay }}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
          );
        })}
      </section>

      {/* Quick Filters */}
      <section className="py-8 bg-apple-gray-6 dark:bg-apple-dark-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {quickFilters.map((filter, index) => (
              <Button
                key={index}
                variant={categoryId === filter.filter ? "default" : "outline"}
                onClick={() => setCategoryId(categoryId === filter.filter ? "all" : filter.filter)}
                className={`px-4 py-2 rounded-full text-subheadline font-medium transition-all duration-200 shadow-apple ${categoryId === filter.filter
                  ? "bg-apple-blue text-white hover:bg-blue-600"
                  : "bg-white dark:bg-apple-dark-2 text-gray-700 dark:text-gray-300 hover:bg-apple-blue hover:text-white dark:hover:bg-apple-blue-dark"
                  }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <main id="productos" className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
            <div className="flex flex-wrap gap-3">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-apple-dark-2 border border-apple-gray-3 dark:border-apple-dark-4 rounded-lg text-subheadline focus:outline-none focus:ring-2 focus:ring-apple-blue"
              >
                <option value="all">Precio: Todos</option>
                <option value="0-50000">$0 - $50.000</option>
                <option value="50000-200000">$50.000 - $200.000</option>
                <option value="200000+">$200.000+</option>
              </select>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-apple-dark-2 border border-apple-gray-3 dark:border-apple-dark-4 rounded-lg text-subheadline focus:outline-none focus:ring-2 focus:ring-apple-blue"
              >
                <option value="all">Marca: Todas</option>
                <option value="Apple">Apple</option>
                <option value="Samsung">Samsung</option>
                <option value="Sony">Sony</option>
                <option value="NVIDIA">NVIDIA</option>
              </select>
              <select
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-apple-dark-2 border border-apple-gray-3 dark:border-apple-dark-4 rounded-lg text-subheadline focus:outline-none focus:ring-2 focus:ring-apple-blue"
              >
                <option value="all">Envío: Todos</option>
                <option value="free">Gratis</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-subheadline text-apple-gray-1">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-apple-dark-2 border border-apple-gray-3 dark:border-apple-dark-4 rounded-lg text-subheadline focus:outline-none focus:ring-2 focus:ring-apple-blue"
              >
                <option value="featured">Más Populares</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
                <option value="rating">Mejor Calificados</option>
                <option value="newest">Más Nuevos</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-apple-dark-2 rounded-2xl overflow-hidden shadow-apple border border-apple-gray-5 dark:border-apple-dark-3 animate-pulse">
                  <div className="w-full h-48 bg-apple-gray-5 dark:bg-apple-dark-3" />
                  <div className="p-4 space-y-4">
                    <div className="h-4 bg-apple-gray-5 dark:bg-apple-dark-3 rounded" />
                    <div className="h-6 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-1/2" />
                    <div className="h-4 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-3/4" />
                    <div className="h-10 bg-apple-gray-5 dark:bg-apple-dark-3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-apple-gray-1" />
              </div>
              <h3 className="text-headline font-semibold mb-2">No se encontraron productos</h3>
              <p className="text-body text-apple-gray-1 mb-6">
                {searchQuery
                  ? `No hay productos que coincidan con "${searchQuery}"`
                  : "Aún no hay productos disponibles"
                }
              </p>
              {searchQuery && (
                <Button onClick={() => setLocation("/")}>
                  Ver todos los productos
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    price: product.price, // Ensure price is passed correctly (API returns price/priceCents, check storage.ts)
                    // storage.ts aggregation returns 'price' as 'firstVariant.priceCents'. 
                    // Wait, ProductCard likely expects price in cents or main unit? 
                    // Let's check ProductCard. usually it expects cents if it formats it, or we format it here.
                    // storage.ts aggregation: price: "$firstVariant.priceCents"
                    // So product.price is in cents.
                    rating: product.rating || 0,
                    reviewCount: product.reviewCount || 0,
                    seller: {
                      displayName: product.seller?.displayName || product.sellerName || "Vendedor",
                      location: product.seller?.location || "Santiago, Chile"
                    },
                    trending: false, // Logic for trending?
                    freeShipping: product.isFreeShipping,
                    shippingCost: product.shippingCostCents,
                    discountPercentage: product.discountPercentage,
                    stock: product.stock,
                  }}
                  onView={handleProductView}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {products.length > 0 && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => setLimit(prev => prev + 20)}
                className="button-haptic px-8 py-4 bg-apple-gray-6 dark:bg-apple-dark-2 text-gray-900 dark:text-white hover:bg-apple-gray-5 dark:hover:bg-apple-dark-3 transition-all duration-200 shadow-apple"
              >
                Cargar Más Productos
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-apple-gray-6 dark:bg-apple-dark-1 border-t border-apple-gray-5 dark:border-apple-dark-3 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-tech-blue rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <span className="text-title-2 font-semibold">Silicon Trail</span>
              </div>
              <p className="text-body text-apple-gray-1 dark:text-apple-gray-2 mb-6 max-w-md">
                El marketplace de tecnología más confiable de Chile. Productos verificados, vendedores certificados y la mejor experiencia de compra.
              </p>
            </div>

            <div>
              <h3 className="text-headline font-semibold text-gray-900 dark:text-white mb-4">Comprar</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Computación</a></li>
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Smartphones</a></li>
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Gaming</a></li>
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Audio</a></li>
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Smart Home</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-headline font-semibold text-gray-900 dark:text-white mb-4">Soporte</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Centro de Ayuda</a></li>
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Envíos y Devoluciones</a></li>
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Garantías</a></li>
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Contacto</a></li>
                <li><a href="#" className="text-body text-apple-gray-1 hover:text-apple-blue transition-colors">Vender</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-apple-gray-5 dark:border-apple-dark-3 mt-8 pt-8 text-center">
            <p className="text-footnote text-apple-gray-1">
              © 2024 Silicon Trail. Todos los derechos reservados. |
              <a href="#" className="hover:text-apple-blue transition-colors"> Privacidad</a> |
              <a href="#" className="hover:text-apple-blue transition-colors"> Términos</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}