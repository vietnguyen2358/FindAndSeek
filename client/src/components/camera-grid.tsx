import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockPins, cameraFeeds, mockDetections } from "@/lib/mockData";
import { User } from "lucide-react";

export function CameraGrid() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [hasErrors, setHasErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Fetch cameras from API in a real app
    const cameraData = mockPins.filter(pin => pin.type === "camera").map(pin => ({
      id: pin.id,
      location: pin.location,
      imageUrl: cameraFeeds[pin.id as keyof typeof cameraFeeds],
      timestamp: pin.timestamp || new Date().toISOString(),
      detections: mockDetections.filter(d => d.cameraId === pin.id)
    }));
    
    setCameras(cameraData);
  }, []);

  const handleImageError = (cameraId: number) => {
    setHasErrors(prev => ({ ...prev, [cameraId]: true }));
  };

  return (
    <div className="container py-6">
      <h2 className="text-2xl font-bold mb-6">Live Camera Feeds</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cameras.map((camera) => (
          <Card key={camera.id} className="flex flex-col overflow-hidden h-[500px]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md">
                  {camera.location}
                </CardTitle>
                <Badge variant="secondary">{camera.detections.length} detections</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Last Updated: {new Date(camera.timestamp).toLocaleString()}
              </div>
            </CardHeader>
            <CardContent className="p-3 flex-1 flex flex-col">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <img
                  src={camera.imageUrl}
                  className="w-full h-full object-cover"
                  alt={`Camera feed from ${camera.location}`}
                  onError={() => handleImageError(camera.id)}
                />
                {hasErrors[camera.id] && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Unable to load camera feed
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium mt-3 mb-1">Detected Persons</h3>
              <ScrollArea className="flex-1 -mx-1 px-1">
                <div className="space-y-2">
                  {camera.detections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No detections yet.
                    </p>
                  ) : (
                    camera.detections.map((person: any) => (
                      <Card key={person.id} className="p-2">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 bg-secondary rounded-full">
                            <User className="h-3 w-3 text-secondary-foreground" />
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-medium">{person.description}</div>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">{Math.round(person.confidence * 100)}%</Badge>
                            </div>
                            <div className="text-[10px] text-muted-foreground space-y-0.5">
                              <p><strong>Age:</strong> {person.details.age}</p>
                              <p><strong>Wearing:</strong> {person.details.clothing}</p>
                              <p><strong>Location:</strong> {person.details.environment}</p>
                              <p><strong>Movement:</strong> {person.details.movement}</p>
                              {person.details.distinctive_features.length > 0 && (
                                <p><strong>Distinctive:</strong> {person.details.distinctive_features.join(", ")}</p>
                              )}
                              <p className="text-[9px] mt-0.5">{new Date(person.time).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 