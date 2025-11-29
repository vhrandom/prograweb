import { useState, useEffect } from "react";
import { Search, Command, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ onSearch, placeholder = "Buscar productos...", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [location] = useLocation();

  // Sincronizar input con la URL
  useEffect(() => {
    // Usamos URLSearchParams para leer la query string actual
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get("search");

    // Si hay búsqueda en la URL, la ponemos en el input.
    // Si no, lo dejamos vacío (importante al navegar al Home desde una búsqueda).
    setQuery(searchParam || "");
  }, [location]);

  // Atajo de teclado (Ctrl + K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[name="global-search"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onSearch(""); // Opcional: Esto recargaría todos los productos inmediatamente
    // Foco de vuelta al input
    const searchInput = document.querySelector('input[name="global-search"]') as HTMLInputElement;
    searchInput?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-apple-gray-1" />
      </div>

      <Input
        name="global-search"
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full pl-10 pr-10 py-2.5 bg-apple-gray-6 dark:bg-apple-dark-2 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-all duration-200"
      />

      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        {query ? (
          // Si hay texto, mostramos la X para borrar
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        ) : (
          // Si está vacío, mostramos el atajo de teclado
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-white dark:bg-apple-dark-3 border border-apple-gray-3 dark:border-apple-dark-4 rounded text-caption-1 font-sans font-medium text-apple-gray-1 pointer-events-none">
            <Command className="w-3 h-3 mr-1" />K
          </kbd>
        )}
      </div>
    </form>
  );
}