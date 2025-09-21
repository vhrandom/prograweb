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
  Settings
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

  const handleSearch = (query: string) => {
    if (query.trim()) {
      setLocation(`/?search=${encodeURIComponent(query)}`);
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
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-apple-gray-6 dark:hover:bg-apple-dark-2 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-green rounded-full flex items-center justify-center">
            <span className="text-caption-1 font-semibold text-white">
              {user?.name[0] || "U"}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/orders" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Mis Órdenes</span>
          </Link>
        </DropdownMenuItem>
        {user?.role === "seller" && (
          <DropdownMenuItem asChild>
            <Link href="/seller" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Panel de Vendedor</span>
            </Link>
          </DropdownMenuItem>
        )}
        {user?.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin/dashboard" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Panel Admin</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-tech-blue rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-title-2 font-semibold hidden sm:block">
              Silicon Trail
            </span>
          </Link>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          {/* Navigation Items - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/categories" className="text-body text-gray-700 dark:text-gray-300 hover:text-apple-blue dark:hover:text-apple-blue-dark transition-colors">
              Categorías
            </Link>
            <Link href="/offers" className="text-body text-gray-700 dark:text-gray-300 hover:text-apple-blue dark:hover:text-apple-blue-dark transition-colors">
              Ofertas
            </Link>
            
            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-apple-red dark:bg-apple-red-dark text-white text-caption-2 rounded-full flex items-center justify-center">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
            
            {/* Theme Toggle */}
            <Button onClick={toggleTheme} variant="ghost" size="icon">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            
            {/* User Menu or Auth */}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth">Registrarse</Link>
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
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 bg-apple-red text-white text-caption-2 rounded-full flex items-center justify-center">
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

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-4">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/categories" 
                className="text-body text-gray-700 dark:text-gray-300 hover:text-apple-blue transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categorías
              </Link>
              <Link 
                href="/offers" 
                className="text-body text-gray-700 dark:text-gray-300 hover:text-apple-blue transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ofertas
              </Link>
              
              <div className="flex items-center justify-between">
                <span className="text-body text-gray-700 dark:text-gray-300">Tema</span>
                <Button onClick={toggleTheme} variant="ghost" size="icon">
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
              </div>

              {isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-green rounded-full flex items-center justify-center">
                      <span className="text-caption-1 font-semibold text-white">
                        {user?.name[0] || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <Link 
                    href="/orders" 
                    className="block text-body text-gray-700 dark:text-gray-300 hover:text-apple-blue transition-colors mb-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Mis Órdenes
                  </Link>
                  {user?.role === "seller" && (
                    <Link 
                      href="/seller" 
                      className="block text-body text-gray-700 dark:text-gray-300 hover:text-apple-blue transition-colors mb-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Panel de Vendedor
                    </Link>
                  )}
                  {user?.role === "admin" && (
                    <Link 
                      href="/admin" 
                      className="block text-body text-gray-700 dark:text-gray-300 hover:text-apple-blue transition-colors mb-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Panel Admin
                    </Link>
                  )}
                  <Button 
                    onClick={handleLogout} 
                    variant="ghost" 
                    className="text-red-600 p-0"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                      Iniciar Sesión
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
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
