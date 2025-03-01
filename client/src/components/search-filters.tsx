import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { simulateAiTextAnalysis } from "@/lib/mockAi";

interface SearchFiltersProps {
  onSearch: (filters: string[]) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsAnalyzing(true);
    try {
      const analysis = await simulateAiTextAnalysis(searchQuery);
      const filters = [
        ...analysis.entities,
        ...analysis.locations,
      ];
      onSearch(filters);
      toast({
        title: "Search Analysis Complete",
        description: `Found ${filters.length} potential matches.`,
      });
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to analyze search query.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 flex gap-2">
        <Input
          className="flex-1 bg-background border-border"
          placeholder="Search by name, description, or location..."
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
      <Button variant="outline" size="icon">
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}