import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/currency";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, updateQuantity, removeItem, isLoading } = useCart();

  // Calculate totals (this would need product data to be complete)
  const subtotal = 0; // Calculate from items with product prices
  const shipping = 0; // Free shipping logic
  const total = subtotal + shipping;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-title-2 font-semibold">Carrito de Compras</DialogTitle>
        </DialogHeader>
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-apple-gray-1" />
            </div>
            <h3 className="text-headline font-semibold mb-2">Tu carrito está vacío</h3>
            <p className="text-body text-apple-gray-1 mb-6">
              Añade algunos productos increíbles a tu carrito
            </p>
            <Button onClick={onClose}>
              Seguir Comprando
            </Button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="max-h-96 overflow-y-auto space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center space-x-4 p-4 bg-apple-gray-6 dark:bg-apple-dark-3 rounded-xl"
                >
                  {/* Product Image Placeholder */}
                  <div className="w-16 h-16 bg-apple-gray-4 dark:bg-apple-dark-4 rounded-lg flex items-center justify-center">
                    <span className="text-caption-1 text-apple-gray-1">IMG</span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-headline font-semibold text-gray-900 dark:text-white">
                      Producto {item.variantId.slice(0, 8)}
                    </h3>
                    <p className="text-footnote text-apple-gray-1">
                      SKU: {item.variantId}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.variantId, Math.max(0, item.quantity - 1))}
                      className="h-8 w-8"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-body font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="h-8 w-8"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-headline font-semibold text-apple-blue dark:text-apple-blue-dark">
                      {formatPrice(0)} {/* Would calculate from variant price */}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.variantId)}
                      className="text-apple-red hover:text-apple-red-dark text-footnote"
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="border-t border-apple-gray-5 dark:border-apple-dark-3 pt-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-body">
                  <span className="text-apple-gray-1">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-body">
                  <span className="text-apple-gray-1">Envío</span>
                  <span className="text-apple-green font-medium">Gratis</span>
                </div>
                <div className="flex justify-between text-title-2 font-semibold border-t border-apple-gray-5 dark:border-apple-dark-3 pt-2">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              <Button 
                className="w-full button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-500 shadow-apple-lg transition-all duration-200"
                onClick={onClose}
              >
                Proceder al Pago
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
