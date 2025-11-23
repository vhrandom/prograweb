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
import { Filter, Search } from "lucide-react";

// Hook personalizado para "Debounce"
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

export default function Products() {
    const [location, setLocation] = useLocation();

    // 1. Estado local de filtros
    const [filters, setFilters] = useState({
        search: new URLSearchParams(window.location.search).get("search") || "",
        category: new URLSearchParams(window.location.search).get("category") || "",
        minPrice: 0,
        maxPrice: 2000000,
        sort: "newest",
        hasDiscount: false,
    });

    // 2. Aplicamos Debounce SOLO a la búsqueda (espera 500ms al dejar de escribir)
    const debouncedSearch = useDebounce(filters.search, 500);

    // 3. Sincronizar URL cuando cambian los filtros
    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (filters.category && filters.category !== "all") params.set("category", filters.category);
        if (filters.minPrice > 0) params.set("minPrice", filters.minPrice.toString());
        if (filters.maxPrice < 2000000) params.set("maxPrice", filters.maxPrice.toString());
        if (filters.sort !== "newest") params.set("sort", filters.sort);
        if (filters.hasDiscount) params.set("hasDiscount", "true");

        const newSearch = params.toString();
        if (window.location.search.replace("?", "") !== newSearch) {
            setLocation(`/products?${newSearch}`);
        }
    }, [debouncedSearch, filters.category, filters.minPrice, filters.maxPrice, filters.sort, filters.hasDiscount, setLocation]);

    // 4. Data Fetching
    const { data: products, isLoading } = useQuery({
        // La clave incluye debouncedSearch para refetchear automático
        queryKey: ["products", debouncedSearch, filters.category, filters.minPrice, filters.maxPrice, filters.sort, filters.hasDiscount],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.set("search", debouncedSearch);
            if (filters.category && filters.category !== "all") params.set("category", filters.category);
            params.set("minPrice", filters.minPrice.toString());
            if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
            if (filters.sort) params.set("sort", filters.sort);
            if (filters.hasDiscount) params.set("hasDiscount", "true");

            const res = await fetch(`/api/products?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch products");
            return res.json();
        },
        // IMPORTANTE: staleTime en 0 para búsqueda instantánea
        staleTime: 0,
    });

    const { data: categories } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await fetch("/api/categories");
            if (!res.ok) return [];
            return res.json();
        },
        staleTime: 1000 * 60 * 30, // Categorías sí pueden cachearse
    });

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            category: "",
            minPrice: 0,
            maxPrice: 2000000,
            sort: "newest",
            hasDiscount: false,
        });
    };

    const FilterContent = () => (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold mb-4 hidden md:block">Filtros</h3>
                <Button variant="outline" size="sm" onClick={clearFilters} className="w-full mb-4">
                    Limpiar Filtros
                </Button>
            </div>

            {/* BUSCADOR */}
            <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar producto..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange("search", e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <Label>Categoría</Label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="cat-all" checked={!filters.category} onCheckedChange={() => handleFilterChange("category", "")} />
                        <label htmlFor="cat-all" className="text-sm cursor-pointer">Todas</label>
                    </div>
                    {categories?.map((cat: any) => (
                        <div key={cat.id} className="flex items-center space-x-2">
                            <Checkbox id={`cat-${cat.id}`} checked={filters.category === String(cat.id)} onCheckedChange={() => handleFilterChange("category", String(cat.id))} />
                            <label htmlFor={`cat-${cat.id}`} className="text-sm cursor-pointer">{cat.name}</label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <Label>Precio ($0 - $2.000.000)</Label>
                <Slider
                    defaultValue={[0, 2000000]}
                    value={[filters.minPrice, filters.maxPrice]}
                    max={2000000}
                    step={10000}
                    minStepsBetweenThumbs={1}
                    onValueChange={(vals) => {
                        setFilters(prev => ({ ...prev, minPrice: vals[0], maxPrice: vals[1] }));
                    }}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>${filters.minPrice.toLocaleString()}</span>
                    <span>${filters.maxPrice.toLocaleString()}</span>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="discount" checked={filters.hasDiscount} onCheckedChange={(c) => handleFilterChange("hasDiscount", c)} />
                    <Label htmlFor="discount" className="cursor-pointer">Solo Ofertas</Label>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Desktop */}
                <aside className="hidden md:block w-64 shrink-0">
                    <FilterContent />
                </aside>

                {/* Mobile Filter Sheet */}
                <div className="md:hidden mb-4 flex gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="flex-1">
                                <Filter className="mr-2 h-4 w-4" /> Filtros
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] overflow-y-auto">
                            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
                            <div className="py-4"><FilterContent /></div>
                        </SheetContent>
                    </Sheet>

                    <div className="flex-1 relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">
                            {filters.category && categories
                                ? categories.find((c: any) => String(c.id) === filters.category)?.name
                                : "Todos los Productos"}
                        </h1>
                        <Select value={filters.sort} onValueChange={(v) => handleFilterChange("sort", v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Más Recientes</SelectItem>
                                <SelectItem value="price_asc">Menor Precio</SelectItem>
                                <SelectItem value="price_desc">Mayor Precio</SelectItem>
                                <SelectItem value="popular">Más Populares</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-[400px] bg-gray-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : products?.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground text-lg">No se encontraron productos.</p>
                            <Button variant="link" onClick={clearFilters} className="mt-2">Limpiar filtros</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products?.map((product: any) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onView={(id) => setLocation(`/product/${id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}