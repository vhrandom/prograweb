import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Zap, ArrowLeft } from "lucide-react";

export default function Offers() {
    const [, setLocation] = useLocation();

    const { data: products, isLoading } = useQuery({
        queryKey: ["products-offers"],
        queryFn: async () => {
            const res = await fetch("/api/products?hasDiscount=true");
            if (!res.ok) throw new Error("Failed to fetch offers");
            return res.json();
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950">
            <div className="bg-red-600 text-white py-12">
                <div className="container mx-auto px-4">
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/20 mb-4 -ml-4"
                        onClick={() => setLocation("/")}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold">Ofertas Especiales</h1>
                            <p className="text-red-100 mt-2 text-lg">Aprovecha descuentos exclusivos por tiempo limitado.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-[400px] bg-gray-200 dark:bg-neutral-800 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : products?.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-500 text-xl">No hay ofertas disponibles en este momento.</p>
                        <Button variant="outline" className="mt-4" onClick={() => setLocation("/products")}>
                            Ver todos los productos
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product: any) => (
                            <ProductCard key={product.id} product={product} onView={(id) => setLocation(`/product/${id}`)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
