import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DetectedPerson, MapPin } from "@shared/types";
import { cameraFeeds } from "@/lib/mockData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, User } from "lucide-react";
import { useState, useEffect } from "react";

interface CameraSidebarProps {
  pin: MapPin;
  onClose: () => void;
  detections: DetectedPerson[];
}

export function CameraSidebar({ pin, onClose, detections }: CameraSidebarProps) {
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [cameraDetections, setCameraDetections] = useState<DetectedPerson[]>([]);

  useEffect(() => {
    // Get the camera feed URL for this pin
    const feedUrl = cameraFeeds[pin.id as keyof typeof cameraFeeds];
    console.log("Camera feed URL:", feedUrl, "for pin ID:", pin.id);
    setImageUrl(feedUrl);
    setHasError(false); // Reset error state when switching cameras

    // Filter detections for this camera
    const filtered = detections.filter(d => d.cameraId === pin.id);
    console.log(`Found ${filtered.length} detections for camera ${pin.id}`);
    setCameraDetections(filtered);
  }, [pin, detections]);

  const handleImageError = () => {
    console.error(`Error loading image: ${imageUrl}`);
    setHasError(true);
  };

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {pin.location}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Last Updated: {new Date().toLocaleString()}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4 p-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {imageUrl && (
            <>
              <img
                src={imageUrl}
                className="w-full h-full object-cover"
                alt={`Camera feed from ${pin.location}`}
                onError={handleImageError}
              />
              {/* Debug info */}
              <div className="absolute top-0 left-0 bg-black/70 text-white text-xs p-1 m-1 rounded">
                Camera ID: {pin.id} | Path: {imageUrl}
              </div>
            </>
          )}
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Unable to load camera feed: {imageUrl}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Detections</h3>
            <Badge variant="secondary">{cameraDetections.length} found</Badge>
          </div>
          <ScrollArea className="h-[calc(100vh-26rem)]">
            <div className="space-y-2">
              {cameraDetections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No detections yet.
                </p>
              ) : (
                cameraDetections.map((person) => (
                  <Card key={person.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary rounded-full">
                        <User className="h-4 w-4 text-secondary-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{person.details.age}</div>
                          <Badge variant="outline">{Math.round(person.confidence * 100)}%</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p><strong>Wearing:</strong> {person.details.clothing}</p>
                          <p><strong>Location:</strong> {person.details.environment}</p>
                          <p><strong>Movement:</strong> {person.details.movement}</p>
                          {person.details.distinctive_features.length > 0 && (
                            <p><strong>Distinctive:</strong> {person.details.distinctive_features.join(", ")}</p>
                          )}
                          <p className="text-[10px] mt-1">{new Date(person.time).toLocaleString()}</p>
                        </div>
                      </div>
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