import { useState } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { AlertsPanel } from "@/components/alerts-panel";
import { VideoPlayer } from "@/components/video-player";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, SkipBack, SkipForward, Eye, EyeOff, Bell, Camera, Phone } from "lucide-react";
import { mockPins, mockDetections } from "@/lib/mockData";
import type { DetectedPerson } from "@shared/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock transcript data
const mockTranscripts = [
  {
    id: 1,
    time: "2 minutes ago",
    caller: "Dispatch",
    message: "Received report of suspicious activity near Transit Center",
  },
  {
    id: 2,
    time: "5 minutes ago",
    caller: "Unit 247",
    message: "Confirming visual on suspect matching description. Red jacket, male, approximately 5'10\"",
  },
  {
    id: 3,
    time: "8 minutes ago",
    caller: "Dispatch",
    message: "All units be advised: Subject was last seen heading east on Main Street",
  },
];

export default function Dashboard() {
  const [selectedCamera, setSelectedCamera] = useState<{
    id: number;
    location: string;
  } | null>(null);
  const [hideDetections, setHideDetections] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [selectedPerson, setSelectedPerson] = useState<DetectedPerson | null>(null);
  const totalDuration = "05:00";
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="h-screen overflow-hidden bg-background flex flex-col">
      {/* App Title Bar */}
      <div className="border-b border-border flex-none bg-primary">
        <div className="container mx-auto py-3">
          <h1 className="text-2xl font-bold text-primary-foreground">Find & Seek Hayward</h1>
        </div>
      </div>

      <div className="container mx-auto py-6 flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Combined Camera and Alerts Panel */}
          <div className="lg:col-span-3 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 flex-none">
                <Tabs defaultValue="camera" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="camera" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Camera
                    </TabsTrigger>
                    <TabsTrigger value="alerts" className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Alerts
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="camera" className="mt-4">
                    <ScrollArea className="h-[calc(100vh-16rem)]">
                      {selectedCamera ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
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
                          </div>

                          <div className="aspect-video bg-black rounded-lg relative">
                            <VideoPlayer
                              detections={mockDetections.map((d) => ({
                                bbox: d.bbox,
                                confidence: d.confidence,
                              }))}
                              showDetections={!hideDetections}
                            />
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
                                {mockDetections.length} persons detected
                              </span>
                            </div>
                            <div className="space-y-2">
                              {mockDetections.map((person) => (
                                <Card
                                  key={person.id}
                                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                                  onClick={() => setSelectedPerson(person)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-start gap-3">
                                      <img
                                        src={person.thumbnail}
                                        alt={`Person ${person.id}`}
                                        className="w-12 h-12 rounded flex-shrink-0 bg-blue-500/20 border border-blue-500"
                                      />
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
                                        <div className="mt-1 flex items-center gap-2">
                                          <div className="h-1 flex-1 bg-muted rounded-full">
                                            <div
                                              className="h-full bg-blue-500 rounded-full"
                                              style={{ width: `${person.confidence * 100}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {Math.round(person.confidence * 100)}% match
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          Select a camera from the map to view footage
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="alerts" className="mt-4">
                    <ScrollArea className="h-[calc(100vh-16rem)]">
                      <AlertsPanel />
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-6 h-full">
            <div className="aspect-square w-full relative">
              <div className="absolute inset-0">
                <InteractiveMap
                  center={[-74.006, 40.7128]}
                  zoom={12}
                  pins={mockPins}
                  onPinClick={(pin) =>
                    setSelectedCamera({ id: pin.id, location: pin.location })
                  }
                />
              </div>
            </div>
          </div>

          {/* Communications Panel */}
          <div className="lg:col-span-3 h-full">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2 flex-none">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Communications
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="space-y-4">
                    {mockTranscripts.map((transcript) => (
                      <Card key={transcript.id}>
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{transcript.caller}</span>
                              <span className="text-xs text-muted-foreground">
                                {transcript.time}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {transcript.message}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Search Description Panel */}
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Search Person Description</h3>
                    <input
                      type="text"
                      placeholder="Enter description (e.g. red jacket, male, 5'10'')"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                    <p className="text-xs text-muted-foreground">
                      Search for specific characteristics, clothing, or physical descriptions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Person Details Dialog */}
      <Dialog open={!!selectedPerson} onOpenChange={() => setSelectedPerson(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Person Details
              <Badge variant={selectedPerson?.confidence && selectedPerson.confidence > 0.8 ? "default" : "secondary"}>
                {selectedPerson?.confidence && Math.round(selectedPerson.confidence * 100)}% Match
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <img
                  src={selectedPerson.thumbnail}
                  alt={`Person ${selectedPerson.id}`}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium">Time Detected</h4>
                  <p className="text-sm text-muted-foreground">{selectedPerson.time}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Age Estimate</h4>
                  <p className="text-sm text-muted-foreground">{selectedPerson.details.age}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Clothing Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPerson.details.clothing}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Environment</h4>
                  <p className="text-sm text-muted-foreground">{selectedPerson.details.environment}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Movement</h4>
                  <p className="text-sm text-muted-foreground">{selectedPerson.details.movement}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Distinctive Features</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPerson.details.distinctive_features.map((feature, index) => (
                      <Badge key={index} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}