import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Heart, Share2, Star, CheckCircle, MapPin, Shield, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/currency";

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["/api/products", id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["/api/products", id, "variants"],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}/variants`);
      if (!response.ok) throw new Error("Failed to fetch variants");
      return response.json();
    },
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["/api/products", id, "reviews"],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}/reviews`);
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
    enabled: !!id,
  });

  const currentVariant = variants.find((v: any) => v.id === selectedVariant) || variants[0];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para añadir productos al carrito",
        variant: "destructive",
      });
      return;
    }

    if (!currentVariant) {
      toast({
        title: "Error",
        description: "Selecciona una variante del producto",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(currentVariant.id, quantity);
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

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''} ${
          i < rating ? "text-yellow-400 fill-current" : "text-apple-gray-3"
        }`}
        onClick={() => interactive && onRate?.(i + 1)}
      />
    ));
  };

  if (productLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-8 h-8 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-full" />
              <div className="h-6 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-48" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="w-full h-96 bg-apple-gray-5 dark:bg-apple-dark-3 rounded-2xl" />
              <div className="space-y-6">
                <div className="h-8 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-3/4" />
                <div className="h-6 bg-apple-gray-5 dark:bg-apple-dark-3 rounded w-1/2" />
                <div className="h-12 bg-apple-gray-5 dark:bg-apple-dark-3 rounded" />
                <div className="h-12 bg-apple-gray-5 dark:bg-apple-dark-3 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-title-1 font-semibold mb-4">Producto no encontrado</h1>
          <Button onClick={() => setLocation("/")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="hover:bg-apple-gray-6 dark:hover:bg-apple-dark-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-title-2 font-semibold">{product.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white dark:bg-apple-dark-2 rounded-2xl overflow-hidden shadow-apple border border-apple-gray-5 dark:border-apple-dark-3">
              <img
                src={product.images[0] || "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image: string, index: number) => (
                  <div key={index} className="aspect-square bg-white dark:bg-apple-dark-2 rounded-lg overflow-hidden border border-apple-gray-5 dark:border-apple-dark-3">
                    <img src={image} alt={`${product.title} ${index + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {averageRating > 0 && (
                    <>
                      <div className="flex items-center">
                        {renderStars(Math.round(averageRating))}
                      </div>
                      <span className="text-footnote text-apple-gray-1">
                        ({averageRating.toFixed(1)}) · {reviews.length} reseñas
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsLiked(!isLiked)}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-display font-bold text-apple-blue dark:text-apple-blue-dark">
                  {currentVariant ? formatPrice(currentVariant.priceCents, currentVariant.currency) : ""}
                </span>
                <Badge className="bg-apple-green text-white">
                  En stock
                </Badge>
              </div>
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div className="space-y-3">
                <label className="text-headline font-semibold">Variante:</label>
                <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una variante" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant: any) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.sku} - {formatPrice(variant.priceCents, variant.currency)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-headline font-semibold">Cantidad:</label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="text-body font-medium min-w-[3rem] text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={isAdding || !currentVariant}
              className="w-full button-haptic bg-apple-blue dark:bg-apple-blue-dark text-white hover:bg-blue-600 dark:hover:bg-blue-500 py-4 text-body font-semibold shadow-apple-lg transition-all duration-200"
            >
              {isAdding ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Añadiendo al carrito...</span>
                </div>
              ) : (
                "Añadir al carrito"
              )}
            </Button>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-apple-gray-5 dark:border-apple-dark-3">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-apple-green" />
                <span className="text-footnote">Garantía oficial</span>
              </div>
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-apple-blue" />
                <span className="text-footnote">Envío gratis</span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-5 h-5 text-apple-gray-1" />
                <span className="text-footnote">30 días devolución</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="description">Descripción</TabsTrigger>
            <TabsTrigger value="specifications">Especificaciones</TabsTrigger>
            <TabsTrigger value="reviews">Reseñas ({reviews.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <div className="bg-white dark:bg-apple-dark-2 rounded-2xl p-6 shadow-apple border border-apple-gray-5 dark:border-apple-dark-3">
              <p className="text-body text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description || "No hay descripción disponible para este producto."}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="specifications" className="mt-6">
            <div className="bg-white dark:bg-apple-dark-2 rounded-2xl p-6 shadow-apple border border-apple-gray-5 dark:border-apple-dark-3">
              {product.specsJson ? (
                <div className="space-y-4">
                  {Object.entries(product.specsJson as Record<string, any>).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-apple-gray-5 dark:border-apple-dark-3 last:border-b-0">
                      <span className="text-body font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-body text-apple-gray-1">{String(value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body text-apple-gray-1">No hay especificaciones disponibles.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-6">
              {/* Review Form */}
              {isAuthenticated && (
                <div className="bg-white dark:bg-apple-dark-2 rounded-2xl p-6 shadow-apple border border-apple-gray-5 dark:border-apple-dark-3">
                  <h3 className="text-headline font-semibold mb-4">Escribir una reseña</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-body font-medium mb-2 block">Calificación:</label>
                      <div className="flex items-center space-x-1">
                        {renderStars(reviewRating, true, setReviewRating)}
                      </div>
                    </div>
                    <div>
                      <label className="text-body font-medium mb-2 block">Comentario:</label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Comparte tu experiencia con este producto..."
                        rows={4}
                      />
                    </div>
                    <Button className="button-haptic">
                      Publicar reseña
                    </Button>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="bg-white dark:bg-apple-dark-2 rounded-2xl p-8 shadow-apple border border-apple-gray-5 dark:border-apple-dark-3 text-center">
                    <p className="text-body text-apple-gray-1">Aún no hay reseñas para este producto.</p>
                  </div>
                ) : (
                  reviews.map((review: any) => (
                    <div key={review.id} className="bg-white dark:bg-apple-dark-2 rounded-2xl p-6 shadow-apple border border-apple-gray-5 dark:border-apple-dark-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-apple-blue to-apple-green rounded-full flex items-center justify-center">
                            <span className="text-caption-1 font-semibold text-white">U</span>
                          </div>
                          <div>
                            <p className="text-body font-medium">Usuario</p>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                        <span className="text-footnote text-apple-gray-1">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-body text-gray-700 dark:text-gray-300">{review.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
