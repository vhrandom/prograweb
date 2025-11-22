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
      discountPercentage?: number;
    }>;
    seller?: {
      displayName: string;
      location?: string;
    };
    sellerName?: string;
    sellerRating?: number;
    sellerLocation?: string;
    rating?: number;
    reviewCount?: number;
    badges?: string[];
    stock?: number;
    freeShipping?: boolean;
    shippingCost?: number;
    discountPercentage?: number;
    trending?: boolean;
  };
  onView?: (productId: string) => void;
}

export function ProductCard({ product, onView }: ProductCardProps) {
  console.log("ProductCard product:", product);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const defaultVariant = product.variants?.[0];
  const price = defaultVariant ? formatPrice(defaultVariant.priceCents, defaultVariant.currency) : "";

  const discountPercentage = product.discountPercentage || defaultVariant?.discountPercentage || 0;
  const hasDiscount = discountPercentage > 0;
  const originalPrice = defaultVariant ? defaultVariant.priceCents : 0;
  const discountedPrice = hasDiscount ? Math.round(originalPrice * (1 - discountPercentage / 100)) : originalPrice;

  const displayPrice = defaultVariant ? formatPrice(discountedPrice, defaultVariant.currency) : "";
  const displayOriginalPrice = defaultVariant ? formatPrice(originalPrice, defaultVariant.currency) : "";

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"
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
      className="group relative bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer"
      onClick={handleView}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50 dark:bg-white/5">
        <img
          src={product.images[0] || "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.trending && (
            <Badge className="bg-white/90 dark:bg-black/90 backdrop-blur-md text-black dark:text-white border-none shadow-lg text-[10px] font-bold uppercase tracking-wider px-2 py-1">
              Trending
            </Badge>
          )}
          {product.freeShipping && (
            <Badge className="bg-blue-500/90 backdrop-blur-md text-white border-none shadow-lg text-[10px] font-bold uppercase tracking-wider px-2 py-1">
              Envío Gratis
            </Badge>
          )}

          {!product.freeShipping && product.shippingCost !== undefined && product.shippingCost > 0 && (
            <Badge className="bg-gray-800/90 backdrop-blur-md text-white border-none shadow-lg text-[10px] font-bold uppercase tracking-wider px-2 py-1">
              Envío: ${formatPrice(product.shippingCost, "CLP")}
            </Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-red-500/90 backdrop-blur-md text-white border-none shadow-lg text-[10px] font-bold uppercase tracking-wider px-2 py-1">
              {discountPercentage}% OFF
            </Badge>
          )}
        </div>

        {/* Like Button */}
        <button
          onClick={handleToggleLike}
          className="absolute top-3 right-3 p-2.5 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full shadow-lg hover:bg-white dark:hover:bg-black transition-all duration-300 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
        >
          <Heart
            className={`w-4 h-4 ${isLiked
              ? "text-red-500 fill-current"
              : "text-gray-700 dark:text-white"
              }`}
          />
        </button>


      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {product.title}
        </h3>

        {/* Rating & Reviews */}
        {product.reviewCount && product.reviewCount > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {renderStars(product.rating || 0)}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({product.rating || 0}) · {product.reviewCount} reseñas
            </span>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Sin reseña aún
          </div>
        )}

        {/* Seller Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">
            {product.sellerName?.[0] || (product.seller?.displayName?.[0]) || "V"}
          </div>
          <div className="flex flex-col leading-none gap-1">
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {product.sellerName || product.seller?.displayName || "Vendedor"}
              </span>
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            </div>
            {(product.sellerLocation || product.seller?.location) && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{product.sellerLocation || product.seller?.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="pt-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {displayPrice}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-medium text-base shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Añadir al Carrito
          </Button>
          <Button
            variant="secondary"
            onClick={handleView}
            className="w-12 h-12 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white p-0 transition-all hover:scale-[1.05] active:scale-[0.95]"
          >
            <Eye className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
