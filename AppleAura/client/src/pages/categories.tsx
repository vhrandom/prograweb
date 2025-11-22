import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Laptop, Headphones, Gamepad, Watch, Camera, Tv, Speaker, Package } from "lucide-react";

const ICON_MAP: any = {
    smartphones: Smartphone,
    laptops: Laptop,
    audio: Headphones,
    gaming: Gamepad,
    wearables: Watch,
    cameras: Camera,
    tv: Tv,
    accessories: Speaker
};

export default function Categories() {
    const { data: categories, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await fetch("/api/categories");
            if (!res.ok) throw new Error("Failed to fetch categories");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Explorar Categorías</h1>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Explorar Categorías</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {categories?.map((cat: any) => {
                    const Icon = ICON_MAP[cat.id] || Package; // Fallback icon
                    return (
                        <Link key={cat.id} href={`/products?category=${cat.id}`}>
                            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-gray-200 dark:border-neutral-800 hover:-translate-y-1">
                                <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 shadow-sm">
                                        <Icon className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{cat.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {cat.description || "Descubre nuestra colección de productos en esta categoría."}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
                {(!categories || categories.length === 0) && (
                    <div className="col-span-full text-center py-12">
                        <p className="text-gray-500">No hay categorías disponibles en este momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
