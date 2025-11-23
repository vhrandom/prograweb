import { useState } from "react";
import { useLocation } from "wouter";
import { Minus, Plus, Trash2, ShoppingBag, Shield, Truck, CheckCircle } from "lucide-react";
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

  // Si no está logueado, mostrar pantalla de bloqueo
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Inicia sesión para ver tu carrito</h1>
          <p className="text-muted-foreground mb-8">
            Necesitas una cuenta para guardar productos y proceder al pago.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => setLocation("/")}>Volver</Button>
            <Button onClick={() => setLocation("/auth")}>Iniciar Sesión</Button>
          </div>
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
      // Aquí iría la integración con Stripe / Webpay
      toast({
        title: "Próximamente",
        description: "La pasarela de pago estará disponible en la próxima actualización.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al iniciar el pago",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calcular totales (precios vienen en centavos desde el backend)
  const subtotal = items.reduce((acc, item) => {
    return acc + (item.productPrice * item.quantity);
  }, 0);

  const shipping = subtotal > 50000 ? 0 : 5000; // Ejemplo: Envío gratis sobre 50.000
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-48" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 space-y-4 border shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-8 bg-muted rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Carrito de Compras</h1>
          {items.length > 0 && (
            <Button
              variant="ghost"
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Vaciar carrito
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border shadow-sm">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Parece que aún no has añadido nada. Explora nuestras categorías y encuentra lo que buscas.
            </p>
            <Button
              onClick={() => setLocation("/products")}
              size="lg"
              className="px-8"
            >
              Explorar Productos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.variantId} // Usamos variantId como key única
                  className="bg-card rounded-2xl p-4 sm:p-6 shadow-sm border hover:border-primary/50 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Imagen del producto */}
                    <div className="w-24 h-24 bg-white rounded-xl overflow-hidden border flex-shrink-0">
                      <img
                        src={item.productImage || "/images/placeholder.jpg"}
                        alt={item.productName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                            {item.productName}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.variantId)}
                            className="text-muted-foreground hover:text-red-500 -mt-1 -mr-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          SKU: {item.sku || "---"}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="font-bold text-lg text-primary">
                          {formatPrice(item.productPrice)}
                        </div>

                        <div className="flex items-center bg-muted rounded-lg p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md"
                            onClick={() => handleQuantityChange(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md"
                            onClick={() => handleQuantityChange(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de Orden */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl p-6 shadow-lg border sticky top-24">
                <h3 className="text-xl font-semibold mb-6">Resumen</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    {shipping === 0 ? (
                      <span className="font-medium text-green-600">Gratis</span>
                    ) : (
                      <span className="font-medium">{formatPrice(shipping)}</span>
                    )}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-end">
                      <span className="text-base font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                    </div>
                    {shipping === 0 && (
                      <p className="text-xs text-green-600 mt-1 text-right">¡Tienes envío gratis!</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isProcessing || items.length === 0}
                  size="lg"
                  className="w-full font-bold text-md py-6 shadow-md hover:shadow-lg transition-all"
                >
                  {isProcessing ? "Procesando..." : "Ir a Pagar"}
                </Button>

                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    onClick={() => setLocation("/products")}
                    className="text-primary text-sm"
                  >
                    Seguir comprando
                  </Button>
                </div>

                {/* Badges de Seguridad */}
                <div className="mt-6 pt-6 border-t flex flex-col gap-2">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 mr-2 text-green-600" />
                    Pagos seguros encriptados
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Truck className="w-4 h-4 mr-2 text-blue-600" />
                    Envíos a todo el país
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                    Garantía de satisfacción
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