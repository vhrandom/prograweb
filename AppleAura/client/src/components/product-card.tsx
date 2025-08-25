import { useState } from "react";
import { Heart, Eye, ShoppingCart, Star, CheckCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/currency";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    images: string[];
    variants?: Array<{
      id: string;
      priceCents: number;
      currency: string;
    }>;
    seller?: {
      displayName: string;
      location?: string;
    };
    rating?: number;
    reviewCount?: number;
    badges?: string[];
    stock?: number;
    freeShipping?: boolean;
    trending?: boolean;
  };
  onView?: (productId: string) => void;
}

export function ProductCard({ product, onView }: ProductCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const defaultVariant = product.variants?.[0];
  const price = defaultVariant ? formatPrice(defaultVariant.priceCents, defaultVariant.currency) : "";
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-apple-gray-3"
        }`}
      />
    ));
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para añadir productos al carrito",
        variant: "destructive",
      });
      return;
    }

    if (!defaultVariant) {
      toast({
        title: "Error",
        description: "Este producto no está disponible",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(defaultVariant.id, 1);
      toast({
        title: "¡Añadido al carrito!",
        description: `${product.title} se añadió a tu carrito`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo añadir el producto al carrito",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleView = () => {
    onView?.(product.id);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <div 
      className="product-card-hover bg-white dark:bg-apple-dark-2 rounded-2xl overflow-hidden shadow-apple hover:shadow-float border border-apple-gray-5 dark:border-apple-dark-3 cursor-pointer"
      onClick={handleView}
    >
      <div className="relative">
        <img 
          src={product.images[0] || "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"} 
          alt={product.title}
          className="w-full h-48 object-cover"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.trending && (
            <Badge className="bg-apple-red text-white text-caption-1 font-semibold animate-glow-pulse">
              🔥 Trending
            </Badge>
          )}
          {product.stock && product.stock < 10 && (
            <Badge className="bg-yellow-500 text-white text-caption-1 font-semibold">
              ⚡ Stock Bajo
            </Badge>
          )}
          {product.freeShipping && (
            <Badge className="bg-apple-green text-white text-caption-1 font-semibold">
              🚚 Gratis
            </Badge>
          )}
        </div>

        <button
          onClick={handleToggleLike}
          className="absolute top-3 right-3 p-2 bg-white bg-opacity-90 rounded-full shadow-apple hover:bg-opacity-100 transition-all duration-200"
        >
          <Heart 
            className={`w-4 h-4 ${
              isLiked 
                ? "text-red-500 fill-current" 
                : "text-gray-600"
            }`} 
          />
        </button>

        {/* Stock Progress Bar */}
        {product.stock && product.stock < 10 && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-white bg-opacity-90 rounded-full p-1">
              <div 
                className="bg-apple-red h-1 rounded-full" 
                style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%` }}
              />
            </div>
            <span className="text-caption-2 text-white font-medium bg-black bg-opacity-50 px-2 py-1 rounded-full mt-1 inline-block">
              Solo quedan {product.stock}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-headline font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {product.title}
        </h3>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-title-2 font-bold text-apple-blue dark:text-apple-blue-dark">
            {price}
          </span>
        </div>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center">
              {renderStars(product.rating)}
            </div>
            <span className="text-footnote text-apple-gray-1">
              ({product.rating}) · {product.reviewCount || 0} reseñas
            </span>
          </div>
        )}
        
        {/* Seller Info */}
        {product.seller && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-caption-2 font-bold text-white">
                {product.seller.displayName[0]}
              </span>
            </div>
            <span className="text-footnote text-apple-gray-1">
              {product.seller.displayName}
            </span>
            <CheckCircle className="w-4 h-4 text-apple-green" />
            {product.seller.location && (
              <>
                <MapPin className="w-3 h-3 text-apple-gray-1" />
                <span className="text-caption-2 text-apple-gray-1">
                  {product.seller.location}
                </span>
              </>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex space-x-2">
          <Button 
            onClick={handleAddToCart}
            disabled={isAdding || !defaultVariant}
            className="button-haptic flex-1 bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200"
          >
            {isAdding ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Añadiendo...</span>
              </div>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Añadir al Carrito
              </>
            )}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleView();
            }}
            variant="outline"
            size="icon"
            className="button-haptic bg-apple-gray-6 dark:bg-apple-dark-3 hover:bg-apple-gray-5 dark:hover:bg-apple-dark-4 transition-all duration-200"
          >
            <Eye className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
