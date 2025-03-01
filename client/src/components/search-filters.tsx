import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Search Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="Search by description, location, or attributes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={isAnalyzing || !searchQuery.trim()}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
