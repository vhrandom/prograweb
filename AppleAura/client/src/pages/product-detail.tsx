import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Heart, Share2, Star, CheckCircle, MapPin, Shield, Truck, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const handleSubmitReview = async () => {
    if (!isAuthenticated) return;
    if (reviewRating === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona una calificación",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast({
        title: "¡Reseña publicada!",
        description: "Gracias por compartir tu opinión",
      });

      setReviewComment("");
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ["/api/products", id, "reviews"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo publicar la reseña",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''} ${i < rating ? "text-yellow-400 fill-current" : "text-apple-gray-3"
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
          {/* Product Gallery Premium */}
          <div className="space-y-6">
            <div className="aspect-square relative bg-white dark:bg-apple-dark-2 rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent dark:from-white/5 pointer-events-none z-10" />
              <img
                src={product.images[0] || "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Zoom Hint */}
              <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Share2 className="w-5 h-5" /> {/* Reusing icon for now, ideally ZoomIn */}
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1, 5).map((image: string, index: number) => (
                  <div key={index} className="aspect-square cursor-pointer bg-white dark:bg-apple-dark-2 rounded-2xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
                    <img src={image} alt={`${product.title} ${index + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          {/* Product Info Premium */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  {averageRating > 0 && (
                    <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                      <div className="flex items-center mr-2">
                        {renderStars(Math.round(averageRating))}
                      </div>
                      <span className="text-sm font-medium text-yellow-700 dark:text-yellow-500">
                        {averageRating.toFixed(1)} ({reviews.length} reseñas)
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsLiked(!isLiked)}
                    className="rounded-full w-12 h-12 border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full w-12 h-12 border-gray-200 dark:border-gray-700">
                    <Share2 className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                  </Button>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
                {product.title}
              </h1>

              <div className="flex items-end gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  {currentVariant ? formatPrice(currentVariant.priceCents, currentVariant.currency) : ""}
                </span>
                <Badge className="mb-2 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-100">
                  En stock
                </Badge>
              </div>
            </div>

            {/* Seller Info Premium */}
            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-white/10 hover:border-blue-200 dark:hover:border-blue-800 transition-colors cursor-pointer group">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
                  {(product.seller?.displayName || "V")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Vendido por</p>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {product.seller?.displayName || "Vendedor Verificado"}
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    </span>
                    {product.seller?.city && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <MapPin className="w-3 h-3 mr-1" />
                        {product.seller.city}
                      </div>
                    )}
                  </div>
                </div>
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
                <span className="text-footnote">{product.isFreeShipping ? "Envío gratis" : "Envío pagado"}</span>
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
                    <Button className="button-haptic" onClick={handleSubmitReview}>
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
                    <div key={review.id} className="border-b border-apple-gray-5 dark:border-apple-dark-3 pb-6 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-apple-gray-6 dark:bg-apple-dark-3 rounded-full flex items-center justify-center">
                            <span className="text-caption-1 font-semibold text-gray-600 dark:text-gray-300">
                              {(review.userName || "U")[0].toUpperCase()}
                            </span>
                          </div>
                          <span className="text-subheadline font-semibold">{review.userName || "Usuario"}</span>
                        </div>
                        <span className="text-caption-1 text-apple-gray-1">
                          {review.date ? new Date(review.date).toLocaleDateString() : "Fecha desconocida"}
                        </span>
                      </div>
                      <div className="flex items-center mb-2">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-body text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div >
  );
}
