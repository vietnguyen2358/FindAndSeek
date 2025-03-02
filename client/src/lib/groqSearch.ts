import type { SearchFilter } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";

export async function parseSearchQuery(query: string): Promise<SearchFilter[]> {
  try {
    const result = await apiRequest("/api/parse-search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });

    return result.filters || [];
  } catch (error) {
    console.error('Error parsing search query:', error);
    return [];
  }
}

export function matchPersonToFilters(person: any, filters: SearchFilter[]): boolean {
  return filters.every(filter => {
    const searchValue = filter.value.toLowerCase();
    switch (filter.category) {
      case 'clothing':
        return person.details.clothing.toLowerCase().includes(searchValue);
      case 'physical':
        return person.details.distinctive_features.some((f: string) => 
          f.toLowerCase().includes(searchValue)
        );
      case 'location':
        return person.details.environment.toLowerCase().includes(searchValue);
      case 'time':
        return person.time.toLowerCase().includes(searchValue);
      case 'age':
        return person.details.age.toLowerCase().includes(searchValue);
      case 'action':
        return person.details.movement.toLowerCase().includes(searchValue);
      default:
        return false;
    }
  });
}