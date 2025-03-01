import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Users } from "lucide-react";
import type { Case } from "@shared/schema";

export function OperatorDashboard() {
  const { data: cases, isLoading, error } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load dashboard data.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Cases
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {cases?.map((case_) => (
              <Card key={case_.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{case_.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {case_.description}
                    </p>
                    <p className="text-sm mt-2">
                      Last seen: {case_.lastLocation}
                    </p>
                  </div>
                  <Badge
                    variant={case_.status === "active" ? "destructive" : "default"}
                  >
                    {case_.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
