import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetectedPerson, MapPin } from "@shared/types";
import { cameraFeeds } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CameraSidebarProps {
  pin: MapPin;
  onClose: () => void;
  detections: DetectedPerson[];
}

export function CameraSidebar({ pin, onClose, detections }: CameraSidebarProps) {
  return (
    <Card className="w-full h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader className="flex-none pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {pin.location}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Last Updated: {new Date(pin.timestamp || '').toLocaleString()}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 p-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {cameraFeeds[pin.id] ? (
            <img
              src={cameraFeeds[pin.id]}
              className="w-full h-full object-cover"
              alt={`Live feed from ${pin.location}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Camera feed not available
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Detections</h3>
            <Badge variant="secondary">{detections.length} found</Badge>
          </div>
          <ScrollArea className="h-[calc(100vh-26rem)]">
            <div className="space-y-2">
              {detections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No detections yet. Processing live feed...
                </p>
              ) : (
                detections.map((person) => (
                  <Card key={person.id} className="p-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{person.description}</span>
                        <Badge variant="outline">{Math.round(person.confidence * 100)}%</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(person.time).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}