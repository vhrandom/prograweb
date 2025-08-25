import { useState, useEffect } from "react";
import { Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ onSearch, placeholder = "Buscar productos...", className = "" }: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
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

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-apple-gray-1" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full pl-10 pr-10 py-2.5 bg-apple-gray-6 dark:bg-apple-dark-2 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-apple-blue focus:border-apple-blue transition-all duration-200"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        <kbd className="inline-flex items-center px-2 py-1 bg-white dark:bg-apple-dark-3 border border-apple-gray-3 dark:border-apple-dark-4 rounded text-caption-1 font-sans font-medium text-apple-gray-1">
          <Command className="w-3 h-3 mr-1" />K
        </kbd>
      </div>
    </form>
  );
}
