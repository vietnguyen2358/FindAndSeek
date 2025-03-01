import { Bell, AlertTriangle, MapPin, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Alert {
  id: number;
  type: "detection" | "match" | "area_update";
  title: string;
  description: string;
  time: string;
  confidence?: number;
}

export function AlertsPanel() {
  // Mock alerts data - in real app, this would come from a real-time source
  const alerts: Alert[] = [
    {
      id: 1,
      type: "detection",
      title: "High Confidence Detection",
      description: "Person matching description spotted at Transit Center",
      time: "2 minutes ago",
      confidence: 0.89,
    },
    {
      id: 2,
      type: "area_update",
      title: "Search Area Updated",
      description: "Search radius expanded to include Downtown district",
      time: "5 minutes ago",
    },
    {
      id: 3,
      type: "match",
      title: "Potential Match Found",
      description: "Red jacket, male, 5'10\" spotted on 5th Avenue camera",
      time: "10 minutes ago",
      confidence: 0.75,
    },
  ];

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "detection":
        return <Camera className="h-4 w-4 text-blue-500" />;
      case "match":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "area_update":
        return <MapPin className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Live Alerts
        </CardTitle>
        <Badge variant="secondary">{alerts.length} new</Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{alert.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {alert.time}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                      {alert.confidence && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground">
                            Confidence
                          </div>
                          <div className="h-2 bg-muted rounded-full mt-1">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${alert.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
