
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { Navigation } from "./components/navigation";
import { AuthProvider } from "./hooks/use-auth";
import { CartProvider } from "./hooks/use-cart";

import Home from "./pages/home";
import Auth from "./pages/auth";
import ProductDetail from "./pages/product-detail";
import Cart from "./pages/cart";
import SellerDashboard from "./pages/seller-dashboard";
import AdminDashboard from "./pages/admin-dashboard";
import NotFound from "./pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="appleaura-theme">
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen bg-background">
              <Navigation />
              <main className="pb-8">
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/auth" component={Auth} />
                  <Route path="/products/:slug" component={ProductDetail} />
                  <Route path="/cart" component={Cart} />
                  <Route path="/seller/dashboard" component={SellerDashboard} />
                  <Route path="/admin/dashboard" component={AdminDashboard} />
                  <Route component={NotFound} />
                </Switch>
              </main>
            </div>
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
