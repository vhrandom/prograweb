import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";

export default function Products() {
    const [location, setLocation] = useLocation();
    const searchParams = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        search: searchParams.get("search") || "",
        category: searchParams.get("category") || "",
        minPrice: searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : 0,
        maxPrice: searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : 2000000,
        sort: searchParams.get("sort") || "newest",
        hasDiscount: searchParams.get("hasDiscount") === "true",
    });

    // Update URL when filters change (debounce or on apply)
    const updateUrl = (newFilters: typeof filters) => {
        const params = new URLSearchParams();
        if (newFilters.search) params.set("search", newFilters.search);
        if (newFilters.category) params.set("category", newFilters.category);
        if (newFilters.minPrice > 0) params.set("minPrice", newFilters.minPrice.toString());
        if (newFilters.maxPrice < 2000000) params.set("maxPrice", newFilters.maxPrice.toString());
        if (newFilters.sort !== "newest") params.set("sort", newFilters.sort);
        if (newFilters.hasDiscount) params.set("hasDiscount", "true");

        setLocation(`/products?${params.toString()}`);
    };

    const { data: products, isLoading } = useQuery({
        queryKey: ["products", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.search) params.set("search", filters.search);
            if (filters.category && filters.category !== "all") params.set("category", filters.category);
            if (filters.minPrice) params.set("minPrice", filters.minPrice.toString());
            if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
            if (filters.sort) params.set("sort", filters.sort);
            if (filters.hasDiscount) params.set("hasDiscount", "true");

            const res = await fetch(`/api/products?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch products");
            return res.json();
        },
    });

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await fetch("/api/categories");
            if (!res.ok) return [];
            return res.json();
        },
    });

    const handleFilterChange = (key: string, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        updateUrl(newFilters);
    };

    const clearFilters = () => {
        const newFilters = {
            search: "",
            category: "",
            minPrice: 0,
            maxPrice: 2000000,
            sort: "newest",
            hasDiscount: false,
        };
        setFilters(newFilters);
        updateUrl(newFilters);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters (Desktop) */}
                <aside className="hidden md:block w-64 space-y-8">
                    <div>
                        <h3 className="font-semibold mb-4">Filtros</h3>
                        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full mb-4">
                            Limpiar Filtros
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <Label>Categoría</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="cat-all"
                                    checked={!filters.category}
                                    onCheckedChange={() => handleFilterChange("category", "")}
                                />
                                <label htmlFor="cat-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Todas
                                </label>
                            </div>
                            {categories?.map((cat: any) => (
                                <div key={cat.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${cat.id}`}
                                        checked={filters.category === cat.id}
                                        onCheckedChange={() => handleFilterChange("category", cat.id)}
                                    />
                                    <label htmlFor={`cat-${cat.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {cat.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label>Precio</Label>
                        <Slider
                            defaultValue={[0, 2000000]}
                            value={[filters.minPrice, filters.maxPrice]}
                            max={2000000}
                            step={10000}
                            onValueChange={(vals) => {
                                handleFilterChange("minPrice", vals[0]);
                                handleFilterChange("maxPrice", vals[1]);
                            }}
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>${filters.minPrice.toLocaleString()}</span>
                            <span>${filters.maxPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="discount"
                                checked={filters.hasDiscount}
                                onCheckedChange={(checked) => handleFilterChange("hasDiscount", checked)}
                            />
                            <Label htmlFor="discount">Solo Ofertas</Label>
                        </div>
                    </div>
                </aside>

                {/* Mobile Filter Sheet */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="md:hidden mb-4">
                            <Filter className="mr-2 h-4 w-4" /> Filtros
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <SheetHeader>
                            <SheetTitle>Filtros</SheetTitle>
                        </SheetHeader>
                        <div className="py-4 space-y-6">
                            {/* Same filters as desktop */}
                            <div className="space-y-4">
                                <Label>Categoría</Label>
                                <Select value={filters.category} onValueChange={(v) => handleFilterChange("category", v === "all" ? "" : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas las categorías" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        {categories?.map((cat: any) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {/* ... other filters ... */}
                            <Button onClick={clearFilters} variant="outline" className="w-full">Limpiar</Button>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Product Grid */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {filters.category ? categories?.find((c: any) => c.id === filters.category)?.name : "Todos los Productos"}
                        </h1>
                        <div className="w-48">
                            <Select value={filters.sort} onValueChange={(v) => handleFilterChange("sort", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Ordenar por" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Más Recientes</SelectItem>
                                    <SelectItem value="price_asc">Menor Precio</SelectItem>
                                    <SelectItem value="price_desc">Mayor Precio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-[400px] bg-gray-100 dark:bg-neutral-800 rounded-3xl animate-pulse" />
                            ))}
                        </div>
                    ) : products?.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-gray-500 text-lg">No se encontraron productos con estos filtros.</p>
                            <Button variant="link" onClick={clearFilters} className="mt-2">Limpiar filtros</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products?.map((product: any) => (
                                <ProductCard key={product.id} product={product} onView={(id) => setLocation(`/product/${id}`)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
