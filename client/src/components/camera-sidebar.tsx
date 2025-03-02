import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetectedPerson, MapPin } from "@shared/types";
import { cameraFeeds } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface CameraSidebarProps {
  pin: MapPin;
  onClose: () => void;
  detections: DetectedPerson[];
}

export function CameraSidebar({ pin, onClose, detections }: CameraSidebarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());

  const handleRefresh = () => {
    setIsLoading(true);
    setTimestamp(Date.now());
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {pin.location}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Stream Status: {isLoading ? "Loading..." : hasError ? "Error" : "Live"}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 p-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          <img
            src={`https://webcams.nyctmc.org${cameraFeeds[pin.id as keyof typeof cameraFeeds]}?t=${timestamp}`}
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            alt={`Live feed from ${pin.location}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Badge variant="secondary" className="animate-pulse">
                Loading feed...
              </Badge>
            </div>
          )}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Unable to load camera feed
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