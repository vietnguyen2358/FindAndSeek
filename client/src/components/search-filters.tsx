import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, SlidersHorizontal, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { simulateAiTextAnalysis } from "@/lib/mockAi";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SearchFiltersProps {
  onSearch: (filters: string[]) => void;
}

export function SearchFilters({ onSearch }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const { toast } = useToast();

  const filterCategories = {
    clothing: ["Red Jacket", "Blue Jeans", "Black Coat", "White Shirt"],
    height: ["Under 5'5\"", "5'5\" - 5'10\"", "Over 5'10\""],
    vehicle: ["Black SUV", "Red Sedan", "White Van"],
    location: ["Downtown", "Residential Area", "Transit Center"],
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && activeFilters.length === 0) return;

    setIsAnalyzing(true);
    try {
      const analysis = await simulateAiTextAnalysis(
        `${searchQuery} ${activeFilters.join(" ")}`
      );
      const filters = [...analysis.entities, ...analysis.locations];
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

  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            className="flex-1 bg-background border-border"
            placeholder="Search by description (e.g. 'person wearing red jacket near downtown')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={isAnalyzing || (!searchQuery.trim() && activeFilters.length === 0)}
            variant="outline"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Search Filters</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-6">
              {Object.entries(filterCategories).map(([category, values]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium mb-2 capitalize">{category}</h3>
                  <Select onValueChange={addFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${category}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {values.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="gap-1">
              {filter}
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