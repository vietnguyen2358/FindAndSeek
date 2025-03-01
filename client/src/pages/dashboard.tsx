import { useState } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { SearchFilters } from "@/components/search-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, SkipBack, SkipForward, Eye, EyeOff } from "lucide-react";

interface DetectedPerson {
  id: number;
  time: string;
  description: string;
}

export default function Dashboard() {
  const [selectedCamera, setSelectedCamera] = useState<{
    id: number;
    location: string;
  } | null>(null);
  const [hideDetections, setHideDetections] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const totalDuration = "05:00";

  const detectedPersons: DetectedPerson[] = [
    {
      id: 1,
      time: "10:15 AM",
      description: "Male, mid-20s, red jacket, blue jeans, carrying backpack",
    },
    {
      id: 2,
      time: "10:16 AM",
      description: "Female, early 20s, black coat, blonde hair",
    },
    {
      id: 3,
      time: "10:17 AM",
      description: "Male, late 30s, brown leather jacket, glasses",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Search Bar */}
      <div className="border-b border-border">
        <div className="container mx-auto py-4">
          <SearchFilters onSearch={console.log} />
        </div>
      </div>

      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map View */}
          <div className="lg:col-span-2">
            <InteractiveMap
              center={[-74.006, 40.7128]} // Default to NYC
              zoom={12}
              pins={[
                {
                  id: 1,
                  lat: 40.7128,
                  lng: -74.006,
                  type: "camera",
                  timestamp: "2024-03-21 15:30",
                },
                {
                  id: 2,
                  lat: 40.7158,
                  lng: -74.009,
                  type: "camera",
                  timestamp: "2024-03-21 16:45",
                },
              ]}
              onPinClick={(pin) => setSelectedCamera({ id: pin.id, location: `Transit Center` })}
            />
          </div>

          {/* Camera Footage Panel */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Camera Footage</CardTitle>
                {selectedCamera && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setHideDetections(!hideDetections)}
                  >
                    {hideDetections ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    <span className="ml-2">
                      {hideDetections ? "Show" : "Hide"} Detections
                    </span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCamera ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Today</span>
                        <span className="text-sm text-muted-foreground">
                          Last updated: 1 minute ago
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Viewing footage from {selectedCamera.location}
                      </p>
                    </div>
                    <div className="aspect-video bg-black rounded-lg relative">
                      {/* Detection overlay boxes */}
                      {!hideDetections && (
                        <div className="absolute inset-0 p-4">
                          <div className="w-1/4 h-full bg-blue-500/20 border border-blue-500 rounded-sm" />
                          <div className="absolute right-4 top-4 w-1/4 h-full bg-blue-500/20 border border-blue-500 rounded-sm" />
                          <div className="absolute left-1/3 top-4 w-1/4 h-full bg-blue-500/20 border border-blue-500 rounded-sm" />
                        </div>
                      )}
                      {/* Video controls */}
                      <div className="absolute bottom-4 left-0 right-0 px-4">
                        <div className="flex items-center justify-between gap-2 text-white">
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline">
                              <SkipBack className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <SkipForward className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-sm">
                            {currentTime} / {totalDuration}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Detected Persons List */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Detected Persons</h3>
                        <span className="text-sm text-muted-foreground">
                          {detectedPersons.length} persons detected
                        </span>
                      </div>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2">
                          {detectedPersons.map((person) => (
                            <Card key={person.id}>
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 bg-blue-500/20 border border-blue-500 rounded flex-shrink-0" />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">Person {person.id}</p>
                                      <span className="text-sm text-muted-foreground">
                                        {person.time}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {person.description}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Select a camera from the map to view footage
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}