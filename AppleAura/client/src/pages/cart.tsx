import { useState } from "react";
import { useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, updateQuantity, removeItem, clearCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-apple-gray-1" />
          </div>
          <h1 className="text-title-1 font-semibold mb-4">Inicia sesión para ver tu carrito</h1>
          <p className="text-body text-apple-gray-1 mb-6">
            Necesitas una cuenta para guardar productos en tu carrito
          </p>
          <Button onClick={() => setLocation("/auth")}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  const handleQuantityChange = async (variantId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      await removeItem(variantId);
    } else {
      await updateQuantity(variantId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // Here would be the checkout logic
      toast({
        title: "Próximamente",
        description: "La funcionalidad de checkout estará disponible pronto",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al procesar el checkout",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = 0; // Would calculate from item prices
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-48" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-apple-dark-2 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-3/4" />
                    <div className="h-3 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-1/2" />
                  </div>
                  <div className="h-8 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-apple-gray-6 dark:bg-apple-dark-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-title-1 font-semibold">Carrito de Compras</h1>
          {items.length > 0 && (
            <Button
              variant="ghost"
              onClick={clearCart}
              className="text-apple-red hover:text-apple-red-dark"
            >
              Vaciar carrito
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-apple-gray-1" />
            </div>
            <h2 className="text-title-2 font-semibold mb-4">Tu carrito está vacío</h2>
            <p className="text-body text-apple-gray-1 mb-8 max-w-md mx-auto">
              Parece que aún no has añadido nada a tu carrito. Ve a explorar nuestros increíbles productos.
            </p>
            <Button 
              onClick={() => setLocation("/")}
              className="button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-500"
            >
              Seguir Comprando
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-apple-dark-2 rounded-2xl p-6 shadow-apple border border-apple-gray-5 dark:border-apple-dark-3 hover-lift"
                >
                  <div className="flex items-center space-x-4">
                    {/* Product Image Placeholder */}
                    <div className="w-20 h-20 bg-apple-gray-4 dark:bg-apple-dark-4 rounded-lg flex items-center justify-center">
                      <span className="text-caption-1 text-apple-gray-1">IMG</span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-headline font-semibold text-gray-900 dark:text-white mb-1">
                        Producto {item.variantId.slice(0, 8)}
                      </h3>
                      <p className="text-footnote text-apple-gray-1 mb-2">
                        SKU: {item.variantId}
                      </p>
                      <p className="text-body font-semibold text-apple-blue dark:text-apple-blue-dark">
                        {formatPrice(0)} {/* Would show actual price */}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.variantId, item.quantity - 1)}
                        className="h-8 w-8 button-haptic"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-body font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.variantId, item.quantity + 1)}
                        className="h-8 w-8 button-haptic"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.variantId)}
                      className="text-apple-red hover:text-apple-red-dark hover:bg-red-50 dark:hover:bg-red-900/20 button-haptic"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-effect bg-white dark:bg-apple-dark-2 rounded-2xl p-6 shadow-apple-lg border border-apple-gray-5 dark:border-apple-dark-3 sticky top-24">
                <h3 className="text-title-3 font-semibold mb-6">Resumen del Pedido</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-body">
                    <span className="text-apple-gray-1">Subtotal ({items.length} {items.length === 1 ? 'producto' : 'productos'})</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-body">
                    <span className="text-apple-gray-1">Envío</span>
                    <span className="font-medium text-apple-green">Gratis</span>
                  </div>
                  <div className="border-t border-apple-gray-5 dark:border-apple-dark-3 pt-4">
                    <div className="flex justify-between text-title-3 font-semibold">
                      <span>Total</span>
                      <span className="text-apple-blue dark:text-apple-blue-dark">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || items.length === 0}
                  className="w-full button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-500 py-4 text-body font-semibold shadow-glow-blue transition-all duration-200"
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    "Proceder al Pago"
                  )}
                </Button>

                <div className="mt-6 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/")}
                    className="text-apple-blue dark:text-apple-blue-dark hover:text-blue-600"
                  >
                    Seguir comprando
                  </Button>
                </div>

                {/* Security Badges */}
                <div className="mt-6 pt-6 border-t border-apple-gray-5 dark:border-apple-dark-3">
                  <div className="flex items-center justify-center space-x-4 text-apple-gray-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-apple-green rounded-full" />
                      <span className="text-caption-1">Compra segura</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-apple-blue rounded-full" />
                      <span className="text-caption-1">Garantía total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
