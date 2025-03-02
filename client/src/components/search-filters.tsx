import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import type { SearchFilter } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";

interface SearchFiltersProps {
  onSearch: (filters: SearchFilter[]) => void;
}

const filterColors: Record<SearchFilter['category'], string> = {
  clothing: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  physical: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  location: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  time: "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20",
  age: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  action: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
};

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsAnalyzing(true);
    try {
      const result = await apiRequest('/api/parse-search', {
        method: 'POST',
        body: JSON.stringify({ query: searchQuery })
      });

      const filters = result.filters || [];
      setActiveFilters(filters);
      onSearch(filters);

      toast({
        title: "Search Analysis Complete",
        description: `Found ${filters.length} search criteria.`,
      });
    } catch (error) {
      console.error('Error parsing search query:', error);
      toast({
        title: "Search Failed",
        description: "Failed to analyze search query.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFilter = (filterToRemove: SearchFilter) => {
    const newFilters = activeFilters.filter(f => 
      f.category !== filterToRemove.category || f.value !== filterToRemove.value
    );
    setActiveFilters(newFilters);
    onSearch(newFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          className="flex-1"
          placeholder="Describe who you're looking for (e.g. 'man wearing black pants and green shirt seen downtown around 3pm')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button
          onClick={handleSearch}
          disabled={isAnalyzing || !searchQuery.trim()}
          variant="outline"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, index) => (
            <Badge
              key={`${filter.category}-${index}`}
              variant="outline"
              className={`gap-1 ${filterColors[filter.category]}`}
            >
              <span className="opacity-60">{filter.category}:</span>
              {filter.value}
              <button
                onClick={() => removeFilter(filter)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}