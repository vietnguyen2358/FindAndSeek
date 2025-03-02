import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetectedPerson } from "@shared/types";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";

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
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{person.description}</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Camera className="w-3 h-3" />
                  <span>Camera {person.cameraId}</span>
                </div>
              </div>
              {person.matchScore !== undefined && (
                <Badge variant="secondary">
                  {Math.round(person.matchScore * 100)}% Match
                </Badge>
              )}
            </div>

            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                {person.time}
              </p>
              <p className="text-sm text-muted-foreground">
                Location: {person.details.environment}
              </p>
            </div>

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