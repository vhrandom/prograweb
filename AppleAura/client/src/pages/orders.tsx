import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ShoppingBag, Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/currency";

export default function Orders() {
    const { data: orders, isLoading } = useQuery({
        queryKey: ["my-orders"],
        queryFn: async () => {
            const res = await fetch("/api/orders");
            if (!res.ok) throw new Error("Failed to fetch orders");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="h-8 w-48 bg-gray-200 dark:bg-neutral-800 rounded mb-8 animate-pulse" />
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Volver</Link>
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mis Órdenes</h1>
                </div>

                <div className="space-y-6">
                    {orders?.length === 0 ? (
                        <Card className="text-center py-12 border-dashed">
                            <CardContent>
                                <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">No tienes órdenes aún</h3>
                                <p className="text-gray-500 mb-6">¡Explora nuestros productos y realiza tu primera compra!</p>
                                <Button asChild>
                                    <Link href="/products">Ir a la Tienda</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        orders?.map((order: any) => (
                            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow border-gray-200 dark:border-neutral-800">
                                <CardHeader className="bg-gray-50 dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 py-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Orden #{order.id.slice(-8).toUpperCase()}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <p className="font-bold text-lg">{formatPrice(order.totalCents, "CLP")}</p>
                                            <Badge variant={
                                                order.status === 'delivered' ? 'default' :
                                                    order.status === 'pending' ? 'secondary' : 'outline'
                                            } className="capitalize">
                                                {order.status === 'delivered' ? 'Entregado' :
                                                    order.status === 'pending' ? 'Pendiente' : order.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {order.items && order.items.length > 0 ? (
                                            <div className="space-y-2">
                                                {order.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span>{item.quantity}x {item.productName || "Producto"}</span>
                                                        <span>{formatPrice(item.unitPriceCents * item.quantity, "CLP")}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Detalles de artículos no disponibles</p>
                                        )}

                                        <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 flex justify-end">
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                                Ver Detalles Completos <ChevronRight className="ml-1 w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
