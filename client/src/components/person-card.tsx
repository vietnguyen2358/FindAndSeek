import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetectedPerson } from "@shared/types";
import { cn } from "@/lib/utils";

interface PersonCardProps {
  person: DetectedPerson;
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
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {person.time} - {person.details.environment}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">
                {person.details.clothing}
              </Badge>
              {person.details.distinctive_features.slice(0, 2).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
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