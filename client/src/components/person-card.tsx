import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetectedPerson } from "@shared/types";
import { cn } from "@/lib/utils";

interface PersonCardProps {
  person: DetectedPerson & { matchScore?: number };
  onClick: () => void;
  highlight?: boolean;
}

export function PersonCard({ person, onClick, highlight }: PersonCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer hover:bg-accent/50 transition-colors",
        highlight && "border-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={person.thumbnail}
            alt={`Person ${person.id}`}
            className="w-16 h-16 rounded object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="font-medium">{person.description}</p>
              <div className="flex gap-2">
                {person.matchScore !== undefined && (
                  <Badge variant={person.matchScore > 0.8 ? "default" : "secondary"}>
                    {Math.round(person.matchScore * 100)}% Match
                  </Badge>
                )}
                <Badge variant={person.confidence > 0.8 ? "default" : "secondary"}>
                  {Math.round(person.confidence * 100)}% Confidence
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {person.time}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {person.details.distinctive_features.slice(0, 2).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}