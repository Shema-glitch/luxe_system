import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  type?: "products" | "sales" | "purchases" | "all";
}

export function Search({ placeholder = "Search...", onSearch, className = "", type = "all" }: SearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ["/api/search", debouncedQuery, type],
    queryFn: () => apiRequest("GET", `/api/search?q=${debouncedQuery}&type=${type}`),
    enabled: debouncedQuery.length > 0,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    setIsOpen(true);
    onSearch?.(value);
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    onSearch?.("");
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 pr-8"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && query && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : results?.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              <div className="space-y-2">
                {results?.map((result: any) => (
                  <button
                    key={result.id}
                    className="w-full rounded-md p-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      // Handle result click
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {result.type === "product" && (
                        <div className="h-8 w-8 rounded-md bg-muted" />
                      )}
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.type === "product" && `SKU: ${result.sku}`}
                          {result.type === "sale" && `Sale #${result.id}`}
                          {result.type === "purchase" && `Purchase #${result.id}`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 