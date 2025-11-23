import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Zap,
  Search,
  ShoppingCart,
  Sun,
  Moon,
  User,
  Menu,
  X,
  Package,
  Settings,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { SearchBar } from "./search-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  // CORRECCIÓN: Redirigir siempre a /products con el query
  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Usamos /products porque ahí vive la lógica de filtrado que arreglamos antes
      setLocation(`/products?search=${encodeURIComponent(query)}`);
    } else {
      // Si la búsqueda está vacía, ir a productos sin filtros
      setLocation("/products");
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-apple-gray-6 dark:hover:bg-apple-dark-2 transition-colors focus:ring-0"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-green rounded-full flex items-center justify-center shadow-sm">
            <span className="text-caption-1 font-semibold text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 mt-2">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium leading-none">{user?.name}</p>
          <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/orders" className="cursor-pointer flex items-center">
            <Package className="w-4 h-4 mr-2" />
            <span>Mis Órdenes</span>
          </Link>
        </DropdownMenuItem>

        {user?.role === "seller" && (
          <DropdownMenuItem asChild>
            <Link href="/seller/dashboard" className="cursor-pointer flex items-center">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span>Panel de Vendedor</span>
            </Link>
          </DropdownMenuItem>
        )}

        {user?.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard" className="cursor-pointer flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              <span>Panel Admin</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-apple-blue to-tech-blue rounded-lg flex items-center justify-center text-white">
              {/* Si no tienes logo.png, usamos un icono como fallback */}
              <Zap className="w-6 h-6" fill="currentColor" />
            </div>
            <span className="text-title-2 font-bold hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
              Silicon Trail
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Navigation Items - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <Link href="/products">
              <Button variant="ghost" className="text-sm font-medium hover:bg-apple-gray-6 dark:hover:bg-white/10">
                Productos
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-apple-gray-6 dark:hover:bg-white/10">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 bg-apple-red text-white text-[10px] p-0 rounded-full flex items-center justify-center border-2 border-white dark:border-neutral-950">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Theme Toggle */}
            <Button onClick={toggleTheme} variant="ghost" size="icon" className="hover:bg-apple-gray-6 dark:hover:bg-white/10">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2" />

            {/* User Menu or Auth */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="hover:bg-apple-gray-6 dark:hover:bg-white/10">
                  <Link href="/auth">Ingresar</Link>
                </Button>
                <Button asChild className="bg-apple-blue hover:bg-blue-600 text-white">
                  <Link href="/auth">Registro</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-apple-red text-white text-[10px] rounded-full flex items-center justify-center">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar (Collapsible) */}
        <div className="md:hidden pb-4">
          <SearchBar onSearch={handleSearch} placeholder="Buscar..." />
        </div>

        {/* Mobile Menu Content */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-white/10 animate-in slide-in-from-top-2">
            <div className="flex flex-col space-y-3 px-2">
              <Link
                href="/products"
                className="flex items-center p-2 rounded-lg hover:bg-apple-gray-6 dark:hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Search className="w-5 h-5 mr-3 text-muted-foreground" />
                Explorar Productos
              </Link>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-apple-gray-6 dark:hover:bg-white/10 cursor-pointer" onClick={toggleTheme}>
                <div className="flex items-center">
                  {theme === 'dark' ? <Moon className="w-5 h-5 mr-3" /> : <Sun className="w-5 h-5 mr-3" />}
                  <span>Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <>
                  <div className="border-t border-gray-200 dark:border-white/10 my-2" />
                  <div className="flex items-center p-2 space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-apple-blue to-apple-green rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{user?.name?.[0]?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/orders"
                    className="flex items-center p-2 rounded-lg hover:bg-apple-gray-6 dark:hover:bg-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Package className="w-5 h-5 mr-3 text-muted-foreground" />
                    Mis Órdenes
                  </Link>

                  {user?.role === "seller" && (
                    <Link
                      href="/seller/dashboard"
                      className="flex items-center p-2 rounded-lg hover:bg-apple-gray-6 dark:hover:bg-white/10"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-5 h-5 mr-3 text-muted-foreground" />
                      Panel de Vendedor
                    </Link>
                  )}

                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      Ingresar
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-apple-blue">
                    <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      Registrarse
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}