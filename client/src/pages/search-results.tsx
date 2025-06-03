import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Tags, ShoppingCart, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

interface SearchResult {
  id: string;
  type: "product" | "category" | "sale" | "report";
  title: string;
  description: string;
  url: string;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { data: results, isLoading } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", query],
    queryFn: async () => {
      // Split the query into words for partial matching
      const searchTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
      
      // If no results, try searching with partial matches
      if (!response.length && searchTerms.length > 0) {
        const partialResults = await Promise.all(
          searchTerms.map(term => 
            apiRequest("GET", `/api/search?q=${encodeURIComponent(term)}`)
          )
        );
        // Flatten and deduplicate results
        return [...new Set(partialResults.flat().map(r => r.id))]
          .map(id => partialResults.flat().find(r => r.id === id));
      }
      
      return response;
    },
    enabled: !!query,
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "product":
        return <Package className="h-5 w-5" />;
      case "category":
        return <Tags className="h-5 w-5" />;
      case "sale":
        return <ShoppingCart className="h-5 w-5" />;
      case "report":
        return <BarChart3 className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "product":
        return "Product";
      case "category":
        return "Category";
      case "sale":
        return "Sale";
      case "report":
        return "Report";
      default:
        return type;
    }
  };

  if (!query) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Enter a search query to see results</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!results?.length) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">No results found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Search Results for "{query}"</h1>
      <div className="grid gap-4">
        {results.map((result) => (
          <Link to={result.url} key={result.id}>
            <Card className="hover:bg-gray-50 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getIcon(result.type)}
                  <div>
                    <CardTitle className="text-lg">{result.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getTypeLabel(result.type)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 